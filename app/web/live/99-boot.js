PL.runModules=function(){PL.modq.forEach(function(m){try{m.run()}catch(e){console.error('module',m.file,e)}});PL.modq=[]};
if(/probe=demo/.test(location.search)){PL.keysBefore=Object.keys(DATA);PL.runModules();PL.keysAfter=Object.keys(DATA);P.start()}
