'use strict';

function handleLogout(req, res)
{
    res.writeHead(401,
    {
        'Content-Type': 'text/plain; charset=utf8'
    });
    res.end('ログアウトしました');
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