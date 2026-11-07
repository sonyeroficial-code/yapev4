const path=require('path');
const fs=require('fs');

// The original bank app already contains its own Lottie renderer. Expose that
// existing instance to the two optional Home icons instead of downloading a
// second copy (which would fail in an offline Acode preview).
const exposeHomeLottie={
  name:'expose-home-lottie',
  setup(build){
    build.onLoad({filter:/chunk-NCGGQLDA\.js$/},args=>{
      const source=fs.readFileSync(args.path,'utf8');
      const needle='var bh=iu(_h());';
      if(source.split(needle).length!==2)throw Error('No se pudo localizar el reproductor Lottie original.');
      return{contents:source.replace(needle,needle+'globalThis.__YPFK_HOME_LOTTIE__=bh.default;'),loader:'js'};
    });
  }
};

require('esbuild').build({absWorkingDir:__dirname,entryPoints:['entrada-local.js'],bundle:true,nodePaths:(process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean),format:'iife',target:'es2020',outfile:'app-local.js',minify:true,legalComments:'eof',plugins:[exposeHomeLottie]}).catch(error=>{console.error(error);process.exitCode=1});

