/* 来源：原神wiki */
try{
	eventTimers
}
catch(e){
	eventTimers=document.getElementsByClassName("eventTimer")
	function eventTimerRun(){
		let nowBJ=new Date(new Date()-(8+new Date().getTimezoneOffset()/60)*60*60*1000)
		for(let i=0;i<eventTimers.length;i++){
			let start=new Date(eventTimers[i].dataset.start.replace('%',''))
			let end=new Date(eventTimers[i].dataset.end.replace('%',''))
			let info=eventTimers[i].dataset.info
			let str="距离"+info
			let timeD=""
			if(start>nowBJ){
				timeD=start-nowBJ
				str+="开始还有"
			}
			else if(end<nowBJ){
				timeD=nowBJ-end
				str+="结束已经过去"
			}
			else{
				timeD=end-nowBJ
				str+="结束还有"
			}
			let format=dhms(timeD)
			if (format[0]>0){
				str += format[0] + "天"
			}
			if (format[1]>0){
				str += format[1] + "小时"
			}
			if (format[2]>0){
				str += format[2] + "分钟"
			}
			/*str+=format[3]+"秒"*/
			eventTimers[i].innerHTML=str
		}
	}
	function dhms(timeD){
		let day=Math.floor(timeD/1000/60/60/24)
		timeD-=day*1000*60*60*24
		let hour=Math.floor(timeD/1000/60/60)
		timeD-=hour*1000*60*60
		let minute=Math.floor(timeD/1000/60)
		timeD-=minute*1000*60
		let second=Math.floor(timeD/1000)
		return [day,hour,minute]
	}
	setInterval(eventTimerRun,1000)
}