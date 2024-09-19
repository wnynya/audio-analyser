var isPaused=!0,isStream=!1,canvases=[];onmessage=event=>{const data=event.data.data;switch(event.data.event){case"init":break;case"play":{play();break}case"pause":{pause();break}case"process":{process(data);break}case"close":{close();break}case"addCanvas":{addCanvas(data);break}case"resizeCanvas":{resizeCanvas(data);break}}};function play(){isPaused=!1}function pause(){isPaused=!0}function close(){pause()}function process(data){function calcRegFFTData(){regFFT.forward(audioBuffer),regFFTAudioSpectrum=regFFT.spectrum,rawRegFFTAudioData=[],splRegFFTAudioData=[],prsRegFFTAudioData=[];for(var i=0;i<regFFTAudioSpectrum.length;i++){loopcount++;var db=10*Math.log10(regFFTAudioSpectrum[i]**2)+70;db=Math.max(0,db),db=Math.min(90,db);var freq=sampleRate/bufferSize*i,ndb=new ISO226(db).freq(freq),e=10**((ndb-70)/10);rawRegFFTAudioData.push([freq,regFFTAudioSpectrum[i]]),splRegFFTAudioData.push([freq,db]),prsRegFFTAudioData.push([freq,e])}}function calcLogDFTData(){logDFT.forward(audioBuffer),logDFTAudioSpectrum=logDFT.spectrum,rawLogDFTAudioData=[],splLogDFTAudioData=[],prsLogDFTAudioData=[];for(var i=0;i<logDFTAudioSpectrum.length;i++){loopcount++;var db=10*Math.log10(logDFTAudioSpectrum[i]**2)+70;db=Math.max(0,db),db=Math.min(90,db);var freq=20*10**(3*i/bufferSize),ndb=new ISO226(db).freq(freq),e=10**((ndb-70)/10);rawLogDFTAudioData.push([freq,logDFTAudioSpectrum[i]]),splLogDFTAudioData.push([freq,db]),prsLogDFTAudioData.push([freq,e])}}function calcCpuAudioData(){function essense(num,high,low){return 0<=num?2*high*Math.atan(num/high)-num:0>num?2*low*Math.atan(num/low)-num:void 0}cpuAudioData.loop++;var value1=0,value2=0;for(var i of prsLogDFTAudioData)value1+=i[1],value2+=i[1]*Math.log2(i[0]/440);value2/=value1,value1=Math.log10(10*value1);var Inertia1,Inertia2,Norm1,Norm2,Memory1,Memory2,Emotion1,Emotion2;1==cpuAudioData.loop?(Inertia1=value1,Inertia2=value2,Norm1=1,Norm2=1):(Inertia1=value1+2**cpuAudioData.alpha*cpuAudioData.lastInertia1,Inertia2=value2+2**cpuAudioData.alpha*cpuAudioData.lastInertia2,Norm1=1+2**cpuAudioData.alpha*cpuAudioData.lastNorm1,Norm2=1+2**cpuAudioData.alpha*cpuAudioData.lastNorm2),Memory1=value1-Inertia1/Norm1,Memory2=value2-Inertia2/Norm2,Emotion1=essense(Memory1,cpuAudioData.emo1gamma,cpuAudioData.emo1gamma),Emotion2=essense(Memory2,cpuAudioData.emo2gamma,cpuAudioData.emo2gamma),cpuAudioData.lastInertia1=Inertia1,cpuAudioData.lastInertia2=Inertia2,cpuAudioData.lastNorm1=Norm1,cpuAudioData.lastNorm2=Norm2,cpuAudioData.value1.data=value1,cpuAudioData.value2.data=value2,cpuAudioData.memory1.data=Memory1,cpuAudioData.memory2.data=Memory2,cpuAudioData.emotion1.data=Emotion1,cpuAudioData.emotion2.data=Emotion2,(isStream||100<=cpuAudioData.loop)&&(0==!cpuAudioData.emotion1.sum&&cpuAudioData.sumloop++,cpuAudioData.emotion1.sum+=Emotion1,cpuAudioData.emotion2.sum+=Emotion2)}function postAudioData(){postMessage({event:"process",data:{logDFTAudioSpectrum:logDFTAudioSpectrum,rawLogDFTAudioData:rawLogDFTAudioData,prsLogDFTAudioData:prsLogDFTAudioData,cpuAudioData:cpuAudioData}})}if(!isPaused){loopcount=0;for(var bufferData=new Float32Array(data[0][0].length),i=0;i<data[0][0].length;i++)bufferData[i]=(data[0][0][i]+data[0][1][i])/2;if(0==audioBuffer.length)audioBuffer=bufferData;else if(audioBuffer.length>=bufferSize)calcRegFFTData(),calcLogDFTData(),calcCpuAudioData(),postAudioData(),frameCanvas(),audioBuffer=new Float32Array(0);else{var logDFTb=new Float32Array(audioBuffer.length+bufferData.length);logDFTb.set(audioBuffer),logDFTb.set(bufferData,audioBuffer.length),audioBuffer=logDFTb}firstProcess||(oneFrameCanvas(),firstProcess=!0)}}function addCanvas(data){var canvas={id:data.id,wrapper:data.wrapper,element:data.element,context:data.element.getContext("2d"),type:data.type,res:data.res,style:{strokeStyle:data.strokeStyle||data.color||"rgb(0, 255, 200)",fillStyle:data.fillStyle||data.color||"rgb(0, 255, 200)",font:data.font||12*data.res+"px 'DM Mono', Consolas"}};canvas.element.width=data.offsetWidth*data.res,canvas.element.height=data.offsetHeight*data.res,canvas.element.x=0,canvas.context.lineWidth=data.res,canvas.context.strokeStyle=canvas.style.strokeStyle,canvas.context.fillStyle=canvas.style.fillStyle,canvas.context.font=canvas.style.font,canvas.context.clearRect(0,0,canvas.element.width,canvas.element.height),canvas.context.beginPath(),canvases.push(canvas),oneFrameCanvas(),frameCanvas()}function resizeCanvas(data){for(var canvas of canvases)if(canvas.id==data.id){canvas.element.x=0,canvas.element.width=data.offsetWidth*canvas.res,canvas.element.height=data.offsetHeight*canvas.res,canvas.context.lineWidth=canvas.res,canvas.context.strokeStyle=canvas.style.strokeStyle,canvas.context.fillStyle=canvas.style.fillStyle,canvas.context.font=canvas.style.font;break}oneFrameCanvas()}