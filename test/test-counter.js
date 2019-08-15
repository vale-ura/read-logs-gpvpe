const fs = require('fs');

//(((?:(?:3u)|(?:3U)|(?:2S)|(?:2s)|(?:3U)|(?:01i)|(?:bct))(?:(?:[0-9])*)|(?:(?:\d*)))(?:\.log))

(async () => {
    const dir = await fs.readdirSync('//brvix5valeas222/log');
    const resultMatch = dir.reduce((acc,val) => {
        if(val.includes('3u') || val.includes('3U') || val.includes('2s') || val.includes('2S') || val.includes('01i') || val.includes('aij')){
            return ++acc;
        }

        return acc;
    },0)
    
    console.log(resultMatch);

})();