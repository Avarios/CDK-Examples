const slowFunction = () => {
    var shouldRun = true;
    var ms = 100000000
    var now = new Date().getTime();
    var result = 0
    while(shouldRun) {
    	result += Math.random() * Math.random();
    	console.log(result)
		if (ms != -1 && new Date().getTime() > now + ms)
			return result;
    }
}

process.on('message', (message) => {
  if (message == 'START') {
    console.log('Child process received START message');
    let slowResult = slowFunction();
    let message = `{"totalCount":${slowResult}}`;
    process.send(message);
  }
});