<script lang="ts">
	import debounce from 'lodash.debounce';
	import SearchIcon from '../icons/search.svelte';
	import TimesIcon from '../icons/Times.svelte';
	import Button from '../shared/Button.svelte';

	export let query: string;
	export let debounceTimerInMs = 600;
	let input: HTMLInputElement;

	let value = query;
	let onDebouncedSearch = debounce((text: string) => {
		query = text;
	}, debounceTimerInMs);

	function onClear() {
		value = '';
		input.focus();
	}

	$: onDebouncedSearch(value);
</script>

<div class="input-container">
	<Button color="transparent" nopadding>
		<SearchIcon />
	</Button>
	<input bind:this={input} type="text" bind:value />
	<Button color="transparent" nopadding on:click={onClear}>
		<TimesIcon />
	</Button>
</div>

<style lang="scss">
	$container-width: 300px;
	$container-height: 45px;

	.input-container {
		border-radius: 4px;
		border: solid 2px var(--color-mbg);
		padding: 0 12px;
		min-width: $container-width;
		width: 100%;
		height: $container-height;
		display: flex;
		align-items: center;
		gap: 8px;

		&:focus-within {
			border-color: var(--color-positive);
		}
	}

	input {
		flex-grow: 1;
		background-color: transparent;
		outline: none;
		border: none;
		color: var(--color-fg);
		// Matches svg icon size of 20 given default
		height: 20px;
	}
</style>
