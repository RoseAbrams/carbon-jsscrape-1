chrome.storage.local.get(null, (storage) => {
	if (storage.setting_gender_account == undefined) {
		var preset = prompt("preset: (g/r/h/w/∅)");
		var settings = {};
		if (preset == 'g') {
			settings.setting_gender_account = 1;
			settings.setting_gender_profile = 1;
			settings.setting_location_access = 'Malmö';
			settings.setting_location_choice = '';
			settings.setting_account = 'Gustav';
			settings.setting_agent = '';
		} else if (preset == 'r') {
			settings.setting_gender_account = 2;
			settings.setting_gender_profile = 1;
			settings.setting_location_access = 'Malmö';
			settings.setting_location_choice = '';
			settings.setting_account = 'Rosa';
			settings.setting_agent = '';
		} else if (preset == 'h') {
			settings.setting_gender_account = 1;
			settings.setting_gender_profile = 2;
			settings.setting_location_access = 'Malmö';
			settings.setting_location_choice = '';
			settings.setting_account = 'Gustav (2)';
			settings.setting_agent = '';
		} else if (preset == 'w') {
			settings.setting_gender_account = 2;
			settings.setting_gender_profile = 2;
			settings.setting_location_access = 'Malmö';
			settings.setting_location_choice = prompt('location_choice:', '');
			settings.setting_account = 'Rosa (2)';
			settings.setting_agent = '';
		} else {
			settings.setting_gender_account = parseInt(prompt('gender_account: [unspecified, male, female] (Tdef)'));
			settings.setting_gender_profile = parseInt(prompt('gender_profile: [unspecified, male, female] (Tdef)'));
			settings.setting_location_access = prompt('location_access:', 'Malmö');
			settings.setting_location_choice = prompt('location_choice:');
			settings.setting_account = prompt('account:', 'Gustav Rosa');
			settings.setting_agent = prompt('agent:');
		}
		chrome.storage.local.set(settings);
		console.log(settings);
	}
});
for (var ad_s of document.querySelectorAll("button > span")) {
	if (ad_s.textContent.toUpperCase() == 'NO THANKS' || ad_s.textContent.toUpperCase() == 'MAYBE LATER') {
		ad_s.click();
	}
}
for (var open_s of document.querySelectorAll("span.Hidden")) {
	if (open_s.textContent == 'Open Profile') {
		open_s.parentElement.click();
	}
}
sleep(500).then(() => {
	//console.log("scraping begin");
	
	var badge_temp = "";
	for (var badge_s of document.querySelectorAll("div.focus-button-style > img")) {
		if (badge_s.src.endsWith('.png')) {
			badge_temp = badge_s.src;
		}
	}

	var image_urls = [];
	const pic_interval = 1000;
	let picture_buttons = document.querySelectorAll("div.react-aspect-ratio-placeholder div.tappable-view button");
	if (picture_buttons.length == 0) {
		picture_buttons = (document.querySelectorAll("div.profileCard__slider__img")); //single image, array size 1
	}
	for (let i = 0; i < picture_buttons.length; i++) {
		sleep(i * pic_interval).then(() => {
			picture_buttons.item(i).click();
			sleep(700).then(() => {
				var all_pics = document.querySelectorAll(".keen-slider__slide");
				for (var holder of all_pics) {
					if (holder.getAttribute('aria-hidden') == 'false' && holder.querySelector("div.profileCard__slider__img") != null) {
						var url_container = holder.querySelector("div.profileCard__slider__img").style['background-image']; //TODO handle videos
						image_urls.push(url_container.slice(5, -2));
					}
				}
			});
		});
	}
	sleep(picture_buttons.length * pic_interval).then(() => {
		chrome.storage.local.set({image_urls});
		picture_buttons.item(0).click();

		var profile = {};
		//id is nowhere
		profile.name = document.querySelector("h1").textContent;
		var age_e = document.querySelector("h1").parentElement.parentElement.querySelector("span");
		if (age_e.textContent == "") {
			profile.age = 0;
		} else {
			profile.age = parseInt(age_e.textContent);
		}
		profile.n_pictures = image_urls.length;
		profile.superliked = false;//(age_e.nextElementSibling != null && age_e.nextElementSibling.querySelector("svg.Expand") != null);
		profile.verified = false;
		for (var icon_s of document.querySelectorAll("div.profileContent svg title")) {
			/*console.log("---");
			console.log(icon_s);
			console.log(icon_s.textContent);*/
			if (icon_s.textContent == "Verified!") {
				profile.verified = true;
			}
			if (icon_s.textContent == "Super Like") {
				profile.superliked = true;
			}
		}
		profile.distance = 0;
		profile.label = "";
		profile.work = "";
		profile.education = "";
		profile.city = "";
		rows = document.querySelectorAll("div.Row");
		rowsDone = [];
		for (var i = 0; i < rows.length; i++) {
			rowsDone[i] = false;
		}
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].querySelector("rect ~ path ~ rect") != null) {
				profile.work = rows[i].textContent;
				rowsDone[i] = true;
				continue;
			}
			if (rows[i].textContent.includes('Lives in')) {
				profile.city = rows[i].textContent.slice(9);
				rowsDone[i] = true;
				continue;
			}
			if (rows[i].textContent.includes('kilometers away') || rows[i].textContent.includes('miles away') || rows[i].textContent.includes('mile away')) {
				if (rows[i].textContent.includes('less than a')) {
					profile.distance = 1;
				} else {
					var distanceTemp = parseInt(rows[i].textContent.slice(0, rows[i].textContent.indexOf(' ')));
					if (rows[i].textContent.includes('mile')) {
						distanceTemp = parseInt(distanceTemp * 1.609344);
					}
					profile.distance = distanceTemp;
				}
				rowsDone[i] = true;
				continue;
			}
			if ((rows[i].textContent.toLowerCase().includes('man')
					&& !rows[i].textContent.toLowerCase().includes('manager')
					&& !rows[i].textContent.toLowerCase().includes('management')
					&& !rows[i].textContent.toLowerCase().includes('manchester'))
				|| rows[i].textContent.toLowerCase().includes('woman')
				|| rows[i].textContent.toLowerCase().includes('kvinna')
				|| rows[i].textContent.toLowerCase().includes('binary')
				|| rows[i].textContent.toLowerCase().includes('binär')
				|| rows[i].textContent.toLowerCase().includes('binær')
				|| rows[i].textContent.toLowerCase().includes('gender')
				|| rows[i].textContent.toLowerCase().includes('trans')
				|| rows[i].textContent.toLowerCase().includes('queer')
				|| rows[i].textContent.toLowerCase().includes('sexual')
				|| rows[i].textContent.toLowerCase().includes('sexuell')
				|| rows[i].textContent.toLowerCase().includes('straight')) {
				profile.label = rows[i].textContent;
				rowsDone[i] = true;
				continue;
			} else if (rows[i].querySelector("path") != null && rows[i].querySelector("g") == null) {
				if (rows[i].textContent.includes('Also went to')) {
					profile.education = rows[i].textContent.slice(13);
				} else {
					profile.education = rows[i].textContent;
				}
				rowsDone[i] = true;
				continue;
			}
		}
		for (var i = 0; i < rows.length; i++) {
			if (!rowsDone[i]) {
				console.log("ALERTED");
				console.log(rows);
				alert("One info row wasn't processed! Value:\n" + rows[i].textContent);
			}
		}
		lookingForSearch = document.querySelector("div.Bd > div > div.CenterAlign");
		profile.looking_for = lookingForSearch != null ? lookingForSearch.textContent.toLowerCase() : "";
		profile.interests = [];
		profile.has_instagram = false;
		profile.has_spotify = false;
		profile.spotify_song_title = "";
		profile.spotify_song_artist = "";
		for (var head_s of document.querySelectorAll("h2")) {
			if (head_s.textContent.includes('Passions')) {
				for (var intr of head_s.parentElement.querySelectorAll("div.Bd")) {
					profile.interests.push(intr.textContent.toLowerCase());
				}
			}
			if (head_s.textContent.includes('Instagram')) {
				profile.has_instagram = true;
			}
			if (head_s.textContent.includes('Spotify')) {
				profile.has_spotify = true;
			}
			if (head_s.textContent.includes('Anthem')) {
				var e_title = head_s.parentElement.querySelector("div.Ell");
				profile.spotify_song_title = e_title.textContent;
				profile.spotify_song_artist = e_title.nextElementSibling.textContent;
			}
		}
		var bio_search = document.querySelector("hr + div.BreakWord");
		if (bio_search != null) {
			profile.bio = bio_search.textContent;
		} else {
			profile.bio = "";
		}
		profile.lifestyle = {};
		//for (var l_s of document.querySelectorAll("img")) {  //v2
		for (var lifestyleIcon of document.querySelectorAll("div.Bd > div > img")) {  //v3
			var lifestyleFullElement = lifestyleIcon.parentElement.parentElement;
			var lifestyleIconName = lifestyleIcon.src.slice(lifestyleIcon.src.lastIndexOf('/') + 1, lifestyleIcon.src.lastIndexOf('@'));
			//if (l_s.loading == "lazy" && l_s.alt != "Song art") {  //v2
				//profile.lifestyle[l_s.alt.toLowerCase().replaceAll(' ', '_')] = l_s.parentElement.parentElement.textContent.toLowerCase();  //v1
				//profile.lifestyle[l_s.src.slice(l_s.src.lastIndexOf('/') + 1, l_s.src.lastIndexOf('@'))] = l_s.parentElement.parentElement.textContent.toLowerCase();  //new
				profile.lifestyle[lifestyleIconName] = lifestyleFullElement.textContent.toLowerCase();  //v3
			//}  //v2
		}
		if (badge_temp != "") {
			profile.badge = badge_temp.slice(badge_temp.lastIndexOf('/') + 1, badge_temp.lastIndexOf('.'));
		}
		// all done
		console.log(profile);
		chrome.storage.local.set({profile});
	});
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}