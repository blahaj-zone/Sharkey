import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../models/games/reversi/game';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		my: {
			validator: $.bool.optional,
			default: false
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const q: any = ps.my ? {
		isStarted: true,
		$or: [{
			user1Id: user._id
		}, {
			user2Id: user._id
		}]
	} : {
		isStarted: true
	};

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		q._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		q._id = {
			$lt: ps.untilId
		};
	}

	// Fetch games
	const games = await ReversiGame.find(q, {
		sort: sort,
		limit: ps.limit
	});

	// Reponse
	res(Promise.all(games.map(async (g) => await pack(g, user, {
		detail: false
	}))));
});
