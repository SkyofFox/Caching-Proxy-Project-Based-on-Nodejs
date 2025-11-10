import * as http from 'node:http';
import * as process from 'node:process';

let cache = {};

const clearCache = () => {
    cache = {};
};

const isCacheEntry = (cache) => {
    if(cache.expiresAt){
        return cache.expiresAt < Date.now() ? false:true;
    }

    return true
};

if(process.argv[2] === '--port' && process.argv[4] === '--origin'){
    const PORT = parseInt(process.argv[3],10);//get proxy port

    const webSite = new URL (process.argv[5]);//get url

    if(webSite.protocol !== 'http:'){
        process.stderr.write('unknow protocal');
        process.exit(1);
    }
        
    const HOST = '::1';

    const cacheProxy = http.createServer();

    cacheProxy.on('request',(clientReq,proxyRes) => {
        const cacheKey = clientReq.method.toLowerCase() + clientReq.url;
        const cacheRes = cache[cacheKey] || null;

        const server = {
            host:webSite.hostname,
            port:webSite.port ? parseInt(webSite.port,10): 80,
            path:clientReq.url,
            method:clientReq.method,
            headers:clientReq.headers,
        };

        if(cacheRes){
            if(isCacheEntry(cacheRes)){
                const headers = {...cacheRes.headers,'X-Cache':'HIT'}
                proxyRes.writeHead(cacheRes.statusCode,headers);
                proxyRes.end(cacheRes.body);
                process.stdout.write(`'X-Cache':'HIT'\n`);
                return ;
            }
        }else{
            const proxyReq = http.request(server);

            clientReq.pipe(proxyReq);

            proxyReq.on('response',(serverResponse) => {

                serverResponse.on('error',(err) => {
                    
                    process.stderr.write('server error',err);
                    
                    return;
                });

                const isGetReq = (clientReq) => {
                    if(clientReq.method === 'GET') return true;

                    return false;
                };


                if(isGetReq(clientReq) && String(serverResponse.statusCode).startsWith('2')){
                    const chunks = [];
                    
                    let expiresAt = null;

                    const cacheControl = serverResponse.headers['cache-control'];

                    if (cacheControl) {
                        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
                        if (maxAgeMatch) {
                            const maxAge = parseInt(maxAgeMatch[1], 10);
                            expiresAt = Date.now() + maxAge * 1000; // 转换为毫秒
                        }
                    }

                    serverResponse.on('data',(data) => {chunks.push(data)});

                    serverResponse.on('end',() => {
                        const body = Buffer.concat(chunks);

                        cache[cacheKey] = {
                            statusCode:serverResponse.statusCode,
                            headers:serverResponse.headers,
                            body:body,
                            expiresAt: expiresAt
                        };
                    });
                }

                const headers = {...serverResponse.headers,'X-Cache':'MISS'};
                proxyRes.writeHead(serverResponse.statusCode,headers);
                serverResponse.pipe(proxyRes);
                process.stdout.write(`'X-Cache':'MISS'\n`);
            });

            proxyReq.on('error',() => {
                proxyRes.writeHead(502);
                proxyRes.end('Bad Gateway');
            });

            clientReq.on('error',(err) => {
                console.log('client errReq',err);
                proxyReq.destroy();
            });

            proxyReq.setTimeout(5000,() => {
                proxyReq.destroy();
                proxyRes.statusCode = 504;
                proxyRes.end('Timeout');
            });

        };

    });

    cacheProxy.listen(PORT,HOST,() => {
        console.log('Proxy-Server is living! ');
    });
}else if(process.argv[2] === '--cache-clear'){
    clearCache();
    process.stdout.write(`cache clear`);
}else{
    process.stderr.write('unknow command');
    process.exit(1);
};
