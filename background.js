let timestamp;
let lastSwipe;
let interruptAuto = false;

chrome.runtime.onMessage.addListener((message) => {
	if (message.load == 1) {
		start_session();
	} else if (message.load == 2) {
		new_profile();
	} else if (message.swipe != undefined) {
		start_swipe(message.swipe);
	}
});

function start_session() {
	chrome.storage.local.clear();
	chrome.storage.local.set({"buttons": false});
	new_profile();
}

function start_swipe(data) {
	chrome.storage.local.get(null, (storage) => {
		if (storage.setting_auto == 0 && storage.setting_destroy) {
		} else {
			swipe(data[0]);
			lastSwipe = data[0];
		}
		if (storage.setting_auto == 2 && data[2] == 0) {
			interruptAuto = true;
		}
		sleep(2200).then(() => {
			save(data[0], data[1], data[2]);
		});
		if (storage.setting_auto != 0) {
			sleep(2400).then(() => {
				new_profile();
			});
		}
	});
}

async function new_profile() {
	chrome.storage.local.remove(["image_urls", "profile", "swipe", "timestamp", "matched"]); //cannot use clear() since introducing settings
	timestamp = Date.now();
	chrome.storage.local.set({timestamp});
	chrome.tabs.executeScript({
		file: "/scraper.js"
	});
}

chrome.storage.onChanged.addListener((event) => {
	chrome.storage.local.get(null, (storage) => {
		if (event.image_urls != undefined && event.image_urls.newValue != undefined) {
			for (i in storage.image_urls) {
				for (j in storage.image_urls) {
					if (i != j && storage.image_urls[i] == storage.image_urls[j]) {
						console.log("duplicate pictures, skipping one");
						storage.image_urls[j] = "";
					}
				}
			}
			for (i in storage.image_urls) {
				download(storage.image_urls[i], "picture " + i + '.jpg'); //TODO some are actually webp?
			}
		}
		if (event.profile != undefined && event.profile.newValue != undefined) {
			download(json_url(storage.profile), "profile.json");
			chrome.storage.local.set({"buttons": true});
			if (storage.setting_auto == 2) {
				interruptAuto = false;
				sleep(3000).then(() => {
					console.log(storage)
					console.log('interruptAuto = ' + interruptAuto)
					console.log('lastSwipe = ' + lastSwipe)
					if (!interruptAuto) {
						chrome.storage.local.set({"count": storage.count + 1});
						start_swipe([lastSwipe, -1, 1]);
					}
				});
			}
		}
	});
});

async function swipe(result) {
	//result: [left, right, super]
	//reason: [unspecified, appearance, personality, both, horny, curious]
	//performer: [human, script, bot, advised]
	chrome.storage.local.set({"buttons": false});
	chrome.storage.local.set({"swipe": result});
	chrome.storage.local.set({"matched": false});
	chrome.tabs.executeScript({
		file: "/swiper.js"
	});
}

async function save(result, reason, performer) {
	chrome.storage.local.get(null, (storage) => {
		if (storage.setting_opposite) {
			result = Math.abs(result - 1);
		}
		if (storage.setting_destroy) {
			result = -1;
			reason = -1;
		}
		var metadata = {
			timestamp: storage.timestamp,
			swipe_result: result,
			swipe_reason: reason,
			gender_account: storage.setting_gender_account,
			gender_profile: storage.setting_gender_profile,
			location_access: storage.setting_location_access,
			location_choice: storage.setting_location_choice,
			account: storage.setting_account,
			freemode: storage.setting_free,
			//notes: "",
			matched: storage.matched
		};
		if (storage.setting_agent != "") {
			metadata.agent = storage.setting_agent;
		}
		if (performer != 0) {
			metadata.swipe_performer = performer;
		}
		console.log(metadata);
		download(json_url(metadata), "metadata.json");
	});
}

function json_url(object) {
	return URL.createObjectURL(new Blob([JSON.stringify(object)], {type: "application/json"}));
}

function download(url, filename) {
	if (url == "") {
		console.log("EMPTY URL FOR FILENAME '" + filename + "', ignoring")
		return;
	}
	chrome.downloads.download({
		url: url,
		filename: "gasoline/" + timestamp + "/" + filename,
		conflictAction: "overwrite",
		saveAs: false,
	}/*, (dlid) => {
		chrome.downloads.search({id: dlid}, (dl) => {
			console.log(dl[0]);
		})
	}*/);
	console.log("donwloaded to /" + timestamp + "/" + filename);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}