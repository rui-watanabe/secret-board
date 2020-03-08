'use strict';

function handleLogout(req, res) 
{
    res.writeHead(401, 
    {
        'Content-Type': 'text/html; charset=utf8'
    });
    res.end
    (
        '<!DOCTYPE html><html lang="ja"><body>' +
        '<h1>ログアウトしました</h1>' +
        '<a href="/posts">ログイン</a>' +
        '</body></html>'
    );
}


function handleNotFound(req, res)
{
    res.writeHead(404,
    {
        'Content-Type': 'text/plain; charset=utf8'
    });
    res.end('ページが見つかりませんでした');
}

module.exports = 
{
    handleLogout,
    handleNotFound
};