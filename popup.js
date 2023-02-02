var freeE = document.getElementById("freemode");
var destroyE = document.getElementById("destroymode");
var oppositeE = document.getElementById("oppositemode");
var autoE = document.getElementById("automode");
var countE = document.getElementById("counter");

chrome.storage.local.get(null, (storage) => {
	freeE.checked = false;
	destroyE.checked = false;
	oppositeE.checked = false;
	if (storage.setting_auto != undefined) {
		autoE.selectedIndex = storage.setting_auto;
	} else {
		autoE.selectedIndex = 1;
		storage.setting_auto = 1;
	}
	storage.setting_free = freeE.checked;
	storage.setting_opposite = oppositeE.checked;
	storage.setting_destroy = destroyE.checked;
});

document.getElementById("left-unspc").addEventListener("click", function(){accept(0, 0)});
document.getElementById("right-unspc").addEventListener("click", function(){accept(1, 0)});
document.getElementById("left-appr").addEventListener("click", function(){accept(0, 1)});
document.getElementById("right-appr").addEventListener("click", function(){accept(1, 1)});
document.getElementById("left-pers").addEventListener("click", function(){accept(0, 2)});
document.getElementById("right-pers").addEventListener("click", function(){accept(1, 2)});
document.getElementById("left-both").addEventListener("click", function(){accept(0, 3)});
document.getElementById("right-both").addEventListener("click", function(){accept(1, 3)});
document.getElementById("right-horny").addEventListener("click", function(){accept(1, 4)});
document.getElementById("right-curious").addEventListener("click", function(){accept(1, 5)});
document.getElementById("super-unspc").addEventListener("click", function(){accept(2, 0)});

document.getElementById("init").addEventListener("click", function(){chrome.runtime.sendMessage({"load": 1})});
document.getElementById("rescrape").addEventListener("click", function(){chrome.runtime.sendMessage({"load": 2})});

function accept(result, reason) {
	chrome.storage.local.get(null, (storage) => {
		if (storage.setting_auto == 2) {
			autoE.selectedIndex = 1;
		}
		chrome.storage.local.set({
			"setting_free": freeE.checked,
			"setting_opposite": oppositeE.checked,
			"setting_destroy": destroyE.checked,
			"setting_auto": autoE.selectedIndex
		});
		if (storage.count == undefined) {
			countE.innerHTML = 1;
			chrome.storage.local.set({"count": 1});
		} else {
			countE.innerHTML = storage.count + 1;
			chrome.storage.local.set({"count": storage.count + 1});
		}
	});
	chrome.runtime.sendMessage({"swipe": [result, reason, 0]});
}

chrome.storage.onChanged.addListener((event) => {
	if (event.buttons != undefined && event.buttons.newValue != undefined) {
		for (cur_b of document.querySelectorAll("button:not(.debug)")) {
			cur_b.disabled = !event.buttons.newValue;
		}
	}
});