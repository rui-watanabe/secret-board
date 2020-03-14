'use strict';
const crypto = require('crypto');
const pug = require('pug');
const Cookies = require('cookies');
const Post = require('./post');

const trackingIdKey = 'tracking_id';
const oneTimeTokenMap = new Map();

function handle(req, res) 
{
    const cookies = new Cookies(req, res);
    const trackingId = addTrackingCookie(cookies, req.user);
    switch (req.method) 
    {
        case 'GET':
            res.writeHead(200, 
            {
                'Content-Type': 'text/html; charset=utf8'
            });
            Post.findAll().then((posts) =>
            {
                const oneTimeToken = crypto.randomBytes(8).toString('hex');
                oneTimeTokenMap.set(req.user, oneTimeToken);
                res.end(pug.renderFile('./views/posts.pug', 
                {
                    posts: posts,
                    user: req.user,
                    oneTimeToken: oneTimeToken
                }));
                console.info
                (
                    `閲覧されました: user: ${req.user}, ` +
                    `trackingId: ${trackingId}, ` +
                    `IPアドレス: ${req.connection.remoteAddress}`
                )
            });
            break;
        case 'POST':
            let body = '';
            req.on('data', (chunk) => 
            {
                body = body + chunk;
            }).on('end', () => 
            {
                const decoded = decodeURIComponent(body);
                const dataArray = decoded.split('&');
                const content = decoded[0] ? split('content=')[1] : '';
                const requestedOneTimeToken = dataArray[1] ? dataArray[1].split('oneTimeToken=')[1] : '';
                if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken)
                {
                    console.info('投稿されました: ' + content);
                    Post.create
                    ({
                        content: content,
                        trackingCookie: trackingId,
                        postedBy: req.user
                    }).then(()=>
                    {
                        handleRedirectPosts(req, res);
                    });
                }
            });
            break;
        default:
            break;
    }
}


function handleDelete(req, res) 
{
    switch (req.method) 
    {
        case 'POST':
            let body = '';
            req.on('data', (chunk) => 
            {
                body += chunk;
            }).on('end', () => 
            {
                const decoded = decodeURIComponent(body);
                const id = decoded.split('id=')[1];
                Post.findById(id).then((post) => 
                {
                    if (req.user === post.postedBy || req.user === 'admin') 
                    {
                        post.destroy().then(() => 
                        {
                        handleRedirectPosts(req, res);
                        });
                    }
                });
            });
            break;
        default: 
            break;
    }
}

function addTrackingCookie(cookies, userName) 
{
    const requestedTrackingId = cookies.get(trackingIdKey);
    if (isValidTrackingId(requestedTrackingId, userName)) 
    {
        return requestedTrackingId;
    } else 
    {
        const originalId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
        const trackingId = originalId + '_' + createValidHash(originalId, userName);
        cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
        return trackingId;
    }
}

function isValidTrackingId(trackingId, userName) 
{
    if (!trackingId) 
    {
        return false;
    }
    const splitted = trackingId.split('_');
    const originalId = splitted[0];
    const requestedHash = splitted[1];
    return createValidHash(originalId, userName) === requestedHash;
}

const secretKey =
    `e51365d89912aa23b9906b7a727c5d16f55e7672daa33ddbb330c26b46a1e07a28297b44f
    2895db2796e2451c4895e5bbe2cb2ae562cc35175513f9a2fea81f30877691127ec3c75624
    462f17ee05aef9cfb916e9a9f0d96ada3459820f42c12b7675d1c77beee9df7e1ef582a1ab
    376ad2d6d55b8144ffa3fa113bc0bf6af00cd9af264dc2eaf797307ec653080468e634f0ed
    2c7be919a25d92755339b06085a6ff688c700b5a50f679155c86dc9714b0219e74c989f163
    449c87d03d20d1d3c745acfa71ba5769c58974938bbacec3ce6cb012f6c586e8c3920ef2a5
    392f1c3d5a53836b5da7c1cc686099cae6ab0e2fbd84a8f59110d34f57938cc4a2555`;

function createValidHash(originalId, userName) 
{
    const sha1sum = crypto.createHash('sha1');
    sha1sum.update(originalId + userName + secretKey);
    return sha1sum.digest('hex');
}

function handleRedirectPosts(req, res) 
{
    res.writeHead(303, 
    {
        'Location': '/posts'
    });
    res.end();
}


module.exports = 
{
    handle,
    handleDelete
};