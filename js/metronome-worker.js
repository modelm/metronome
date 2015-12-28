var tickInterval = (60 / Metronome.settings.tempo) * 1000;
self.addEventListener('message', function(e){
	switch (e.data) {
		case 'start':
			Metronome.interval = window.setInterval(Metronome.tick, tickInterval);
			break;
		case 'stop':
			Metronome.stop();
			break;
	};
}, false);
