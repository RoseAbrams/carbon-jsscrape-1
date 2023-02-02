var button_right;
var button_left;
var button_super;
for (b of document.querySelectorAll("button.button")) {
	var desc = b.querySelector("span.Hidden");
	if (desc != null && desc.innerHTML != undefined) {
		switch(desc.innerHTML.toLowerCase()) {
			case "like":
				button_right = b;
				break;
			case "nope":
				button_left = b;
				break;
			case "super like":
				button_super = b;
				break;
		}
	}
}
if (button_right == undefined || button_left == undefined || button_super == undefined) {
	console.log("swipe buttons not found!");
	throw "buttons not found";
}

//chrome.runtime.onMessage.addListener((message) => {
var swipe_dir = undefined; 
chrome.storage.local.get(null, (storage) => {
	swipe_dir = storage.swipe;
});
sleep(50).then(() => {
	if (swipe_dir != undefined) {
		switch(swipe_dir) {
			case 0:
				button_left.click();
				break;
			case 1:
				button_right.click();
				break;
			case 2:
				button_super.click();
				break;
		}
		sleep(2000).then(() => {
			var gotmatch = false;
			for (b of document.querySelectorAll("button:not(.button)")) {
				if (b.getAttribute('title') == "Back to Tinder") {
					console.log("matched");
					gotmatch = true;
					dmfield = document.querySelector("textarea#q-36368680");
					/*sleep(25).then(() => {
						console.log('0')
						dmfield.focus(); // neither works, maybe because weird html
						dmfield.click();
					});
					sleep(50).then(() => {
						console.log('1')
						dmfield.value = storage.timestamp;
					});
					sleep(100).then(() => {
						console.log('2')
						dmfield.nextElementSibling.click();
					});
					sleep(150).then(() => {
						console.log('3')
						*/b.click();/*
					});*/
					break;
				}
			}
			chrome.storage.local.set({"matched": gotmatch});
		});
	}
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}