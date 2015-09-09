$(function($) {
	var player = $('audio,video').mediaelementplayer({
		// automatically create these translations on load
		//translations:['es','ar','yi','zh-cn'],
		// allow the user to add additional translations
		//translationSelector: true,
		// start with English automatically turned on
		startLanguage: 'en'
	});
	
	var srt = $('#mainSrt')[0];
	var srtPath = srt ? srt.src : null;
	
	if (srtPath) {
		$.ajax({
			url: srtPath,
			dataType: 'text',
			success: function(data) {
				var raw = data.split('\n');
				var content = [];
				var lines = [];
				var rl = raw.length;
				// get rid of blank lines and line numbers
				var filteredLines = [];
				for (var i=0; i < rl; i++) {
					var rawLine = raw[i];
					if (rawLine.length > 4) {
						filteredLines.push(rawLine);
					} 
				}
				// iterate through remaining lines
				var lineContent = '';
				var fl = filteredLines.length;
				var line = {};
				for (var i=0; i < fl; i++) {
					var rawLine = filteredLines[i];
					if (rawLine.indexOf('-->') > 0) {
						// line contains timecode; create new line obj
						line = {};
						line.content = "";
						var timestamp = rawLine; // in format "00:00:00,196 --> 00:00:06,376"
						var timestring = timestamp.substring(0, timestamp.indexOf(","));
						var a = timestring.split(":");
						var seconds = (+a[0])*60*60 + (+a[1])*60 + (+a[2]);
						line.timestamp = seconds;	
						lines.push(line);
					} else {
						// line contains text; add to existing line obj
						if (rawLine) {
							line.content += rawLine + " ";
						}
					}
				}
				// create text elements
				var playerElement = player[0];
				// var transcriptContainer = $('<div class="transcriptContainer"></div>').insertAfter(playerElement);
				var transcriptContainer = $('.transcriptContainer');
				var transcriptDiv = $('<div class="transcript"></div>');
				transcriptContainer.append(transcriptDiv);
				var hasPlayed = false;
				for (var i=0; i < lines.length; i++) {
					var line = lines[i];
	
					var lineLink = $('<a class="transcript_link" href="#">' + line.content + '</a>')
						.click(function(e) {
							e.preventDefault();
							var index = $("a").index(this) - 1;
							var timestamp = $.data(transcriptDiv, index.toString());
							var player = $('#player')[0];
							if (player.player) {player = player.player} // regular vs. iOS
							var firstPlay = function(e) {
								if (player.media) { // regular browsers
									player.media.removeEventListener('playing', firstPlay, false);
								} else { // iOS
									player.removeEventListener('playing', firstPlay, false);
								}
								player.setCurrentTime(timestamp);
								hasPlayed = true;
							};
							if (!hasPlayed) {
								player.play();
								if (player.media) { // regular browsers
									player.media.addEventListener('playing', firstPlay, false);
								} else { // iOS
									player.addEventListener('playing', firstPlay, false);
								}
							} else {
								player.setCurrentTime(timestamp);
								player.play();
							}
						});
					line.element = lineLink;
					$.data(transcriptDiv, i.toString(), line.timestamp);
					transcriptDiv.append(lineLink);
				}
				// add slide transition
				var showHideBtn = $('<div class="showHideBtn">Hide Transcript</div>').insertAfter(transcriptDiv)
					.click(function (e) {
						transcriptDiv.slideToggle(400, 'swing', function(e) {
							var btnText = transcriptDiv.is(':hidden') ? "Show Transcript" : "Hide Transcript";
							showHideBtn.text(btnText);
						});
					});
				
				// add progress listener
				$('#player').bind('timeupdate', function(e) {
					for (var i=0; i < lines.length; i++) {
						var line = lines[i];
						if (this.currentTime >= line.timestamp) {
							line.element.addClass("played");
						} else {
							line.element.removeClass("played");
						}
					}
				});
	
			},
			error: function(error) {
				console.log("ERROR:\n\n " + error);
			}
		});
	} else {
		var transcriptContainer = $('.transcriptContainer');
		transcriptContainer.css('display', 'none');
	}


 
});