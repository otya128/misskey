<template>
	<x-notes ref="timeline" :more="existMore ? more : null" :media-view="mediaView"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XNotes from './deck.notes.vue';

const fetchLimit = 10;

export default Vue.extend({
	components: {
		XNotes
	},

	props: {
		src: {
			type: String,
			required: false,
			default: 'home'
		},
		mediaOnly: {
			type: Boolean,
			required: false,
			default: false
		},
		mediaView: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			connection: null,
			connectionId: null
		};
	},

	watch: {
		mediaOnly() {
			this.fetch();
		}
	},

	computed: {
		stream(): any {
			return this.src == 'home'
				? (this as any).os.stream
				: this.src == 'local'
					? (this as any).os.streams.localTimelineStream
					: (this as any).os.streams.globalTimelineStream;
		},

		endpoint(): string {
			return this.src == 'home'
				? 'notes/timeline'
				: this.src == 'local'
					? 'notes/local-timeline'
					: 'notes/global-timeline';
		}
	},

	mounted() {
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.connection.on('note', this.onNote);
		if (this.src == 'home') {
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		}

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		if (this.src == 'home') {
			this.connection.off('follow', this.onChangeFollowing);
			this.connection.off('unfollow', this.onChangeFollowing);
		}
		this.stream.dispose(this.connectionId);
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api(this.endpoint, {
					limit: fetchLimit + 1,
					mediaOnly: this.mediaOnly,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		more() {
			this.moreFetching = true;

			const promise = (this as any).api(this.endpoint, {
				limit: fetchLimit + 1,
				mediaOnly: this.mediaOnly,
				untilId: (this.$refs.timeline as any).tail().id,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		},

		onNote(note) {
			if (this.mediaOnly && note.media.length == 0) return;

			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		},

		onChangeFollowing() {
			this.fetch();
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>
