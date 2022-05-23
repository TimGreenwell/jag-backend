/**
 * @fileOverview REST storage utilities.
 *
 * @author mvignati
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.59
 */

export default class RESTUtils {

	static async request(url, details, error_prefix = 'Error', ok_fallback = undefined, bad_fallback = undefined) {


		const response = await fetch(url, details).catch((error_message) => {
			throw new Error(`${error_prefix}: ${error_message}`);
		});
		if (response.status == 200) {
			if (ok_fallback) return ok_fallback;

			try {
				let gg = await response.json();
				return gg;
			} catch {
				throw new Error(`${error_prefix}: Response was not a valid JSON object.`);
			}
		}

		if (response.status == 204)
			return ok_fallback;

		if (response.status == 404) {
			if (bad_fallback) return bad_fallback;
			throw new Error(`${error_prefix}: Resource does not exist at URN.`);
		}

		if (response.status == 409) {
			if (bad_fallback) return bad_fallback;
			throw new Error(`${error_prefix}: Resource already exists at URN.`);
		}

		throw new Error(`${error_prefix}: Unexpected response.`);
	}

	static async all(url) {
		// TODO: safely join URL paths (perhaps Node package?)
		const details = {};
		let reply =  await RESTUtils.request(url, details, 'Error listing JAGs');
		return reply;
	}

	static async get(url) {
		// TODO: safely join URL paths (perhaps Node package?)
		const options = { };
		return await RESTUtils.request(url, options, 'Error retrieving JAG');
	}

	static async has(url) {
		// TODO: safely join URL paths (perhaps Node package?)
		const options = {
			'method': 'HEAD',
			'headers': {
				'mode': 'cors'
			}
		};
		return await RESTUtils.request(url, options, 'Error finding JAG', true, false);
	}

	static async create(url, description) {
	//	const csrfToken = document.cookie.replace(/(?:(?:^|.*;\s*)XSRF-TOKEN\s*\=\s*([^;]*).*$)|^.*$/, '$1');
		const options = {
			'method': 'POST',
			'body': description,
			'headers': {
	//			'x-xsrf-token': csrfToken,
				'Content-Type': 'application/json',
				'mode': 'cors'
			}
		};
		return await RESTUtils.request(url, options, 'Error creating JAG');
	}

	static async update(url, description) {
		const options = {
			'method': 'PUT',
			'body': description,
			'headers': {
		//		'x-xsrf-token': csrfToken,
				'Content-Type': 'application/json',
				'mode': 'cors'
			}
		};
		return await RESTUtils.request(url, options, 'Error updating JAG');
	}

	static async delete(url) {
		const csrfToken = document.cookie.replace(/(?:(?:^|.*;\s*)XSRF-TOKEN\s*\=\s*([^;]*).*$)|^.*$/, '$1');
		// TODO: safely join URL paths (perhaps Node package?)
		const options = {
			'method': 'DELETE',
			'headers': {
				'x-xsrf-token': csrfToken
			}
		};
		return await RESTUtils.request(url, options, 'Error deleting JAG');
	}


	static async clear(url) {
		//const csrfToken = document.cookie.replace(/(?:(?:^|.*;\s*)XSRF-TOKEN\s*\=\s*([^;]*).*$)|^.*$/, '$1');
		// TODO: safely join URL paths (perhaps Node package?)
		const options = {
			'method': 'DELETE',
			'headers': {
				'mode': 'cors',
			//	'x-xsrf-token': csrfToken
			}
		};
		return await RESTUtils.request(url, options, 'Error clearing JAG');
	}

	static  getCookie(name) {
		if (!document.cookie) {
			return null;
		}

		const xsrfCookies = document.cookie.split(';')
			.map(c => c.trim())
			.filter(c => c.startsWith(name + '='));

		if (xsrfCookies.length === 0) {
			return null;
		}
		return decodeURIComponent(xsrfCookies[0].split('=')[1]);
	}


}
