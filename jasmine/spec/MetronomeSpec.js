describe("Metronome", function() {
	afterEach(function() {
		Metronome.stop();
	});

	it("should be able to start", function() {
		Metronome.start();
		expect(Metronome.interval).not.toEqual(null);
	});

	it("should be able to stop", function() {
		Metronome.stop();
		expect(Metronome.interval).toEqual(null);
	});

	describe("when started", function() {
		beforeEach(function() {
			Metronome.start();
			Metronome.tick(); // this gets called after a while once start() has run, but we can't wait. would be nice to find a way to make this unnecessary TODO
		});

		it("should show the current beat", function() {
			expect(parseInt(document.getElementById('visual-target').innerHTML)).toEqual(Metronome.beat);
		});
	});

	describe("when stopped", function() {
		beforeEach(function() {
			Metronome.stop();
		});

		it("should have an empty beat indicator", function() {
			expect(document.getElementById('visual-target').innerHTML).toEqual('&nbsp;');
		});
	});

	/*
	// demonstrates use of spies to intercept and test method calls
	it("tells the current song if the user has made it a favorite", function() {
	spyOn(song, 'persistFavoriteStatus');

	player.play(song);
	player.makeFavorite();

	expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
	});

	//demonstrates use of expected exceptions
	describe("#resume", function() {
	it("should throw an exception if song is already playing", function() {
	player.play(song);

	expect(function() {
	player.resume();
	}).toThrowError("song is already playing");
	});
	});
	*/
});
