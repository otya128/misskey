import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note from '../../../../models/note';
import deleteNote from '../../../../services/note/delete';
import { ILocalUser } from '../../../../models/user';

/**
 * Delete a note
 */
module.exports = (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Fetch note
	const note = await Note.findOne({
		_id: noteId,
		userId: user._id
	});

	if (note === null) {
		return rej('note not found');
	}

	await deleteNote(user, note);

	res();
});
