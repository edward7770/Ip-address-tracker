// ELEMENTS
const $searchBar = $('#search-bar-main');
const $btn = $('#btn-arrow');
const $resultBar = $('#result-bar');
const $ipAddrEl = $('#ip-address');
const $locationEl = $('#location');
const $timezoneEl = $('#timezone');
const $ispEl = $('#isp');

class App {
	#map;
	#mapZoom = 13;
	#coords;
	#marker;

	timeoutErrMsg = 'Request took too long!';

	constructor() {
		this._getIPData();

		// Events
		$btn.click(this.#_search.bind(this));
		$resultBar.click(this.#_moveTo.bind(this));
	}

	// Event Callbacks
	#_search(e) {
		e.preventDefault();
		if ($searchBar[0].value) {
			this._getIPData($searchBar[0].value);
			$searchBar[0].value = '';
		} else {
			alert(`Field can't be empty!`);
		}
	}

	#_moveTo() {
		if (!this.#map) return;
		this.#map.setView(this.#coords, this.#mapZoom);
	}

	async #_timeout(sec) {
		let errMsg = this.timeoutErrMsg;
		return new Promise(function (_, reject) {
			setTimeout(function () {
				reject(new Error(errMsg));
			}, sec * 1000);
		});
	}

	// Main Functionality

	_reset() {
		$ipAddrEl.text('Failed!');
		$locationEl.text('Failed!');
		$timezoneEl.text('Failed!');
		$ispEl.text('Failed!');
	}

	async _getIPData(ip = '') {
		try {
			// Fetch promise only rejects if there's no internet. It'll send data even if it can't find the IP
			const res = await Promise.race([
				fetch(`https://ipapi.co/${ip}/json`),
				this.#_timeout(30),
			]);
			// prettier-ignore
			if (!res.ok) throw new Error(`Error ${res.status}: Something went wrong. Failed to load.\n`);

			const data = await res.json();
			if (data.error) throw new Error(`Error: ${data.reason}.`);

			this._setIPData(data);
		} catch (e) {
			// prettier-ignore
			alert(`${e.message === 'Failed to fetch' ? 'Disable AdBlocker\nor Check Your Internet Connection.' : e.message} Try again!`);
			this._reset();
		}
	}

	_setIPData({
		ip,
		city,
		region,
		country_name,
		postal,
		utc_offset,
		org,
		latitude,
		longitude,
	}) {
		$ipAddrEl.text(ip);
		$locationEl.html(`${city}, ${region},<br>${country_name} - ${postal}`);
		$timezoneEl.text(`UTC${utc_offset}`);
		$ispEl.text(org);

		this.#coords = [latitude, longitude];

		if (this.#map) {
			this.#map.setView(this.#coords, this.#mapZoom);
			this.#_setMarker();
		} else {
			this._loadMap();
		}
	}

	_loadMap() {
		// LeafLets: Library
		this.#map = L.map('map').setView(this.#coords, this.#mapZoom);

		// Google Map
		L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
			maxZoom: 20,
			subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
		}).addTo(this.#map);

		this.#_setMarker();
	}

	#_setMarker() {
		if (this.#marker) this.#map.removeLayer(this.#marker);

		this.#marker = L.marker(this.#coords, {
			icon: L.icon({
				iconUrl: 'images/icon-location.svg',
				iconAnchor: [24, 56],
			}),
		})
			.addTo(this.#map)
			.openPopup();
	}
}

const app = new App();
