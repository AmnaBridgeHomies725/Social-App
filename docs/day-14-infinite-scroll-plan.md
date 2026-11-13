# Day 14: Infinite Scroll Design

## Current pagination
- The home page loads the first page of posts.
- `getPostsServerFn` returns posts, `hasMore`, and `nextCursor`.
- Posts are ordered by `created_at` and `id` so pages stay in a stable order.

## Next-page flow
1. The feed receives the first page and its `nextCursor`.
2. An `IntersectionObserver` watches a marker at the bottom of the feed.
3. When the marker appears on screen, check that a `nextCursor` exists and no page is already loading.
4. Request the next page with the cursor.
5. Add the new posts to the feed and save the new cursor.

## Stop and error rules
- Stop requesting pages when `nextCursor` is `null`.
- Do not start another request while a page is loading.
- Show an error if a request fails and allow the user to retry.

## Query cache plan
- Use `["posts"]` as the feed query key.
- Use the cursor as the page parameter for each next page.
- Add search or filter values to the query key if those features are added.
- Refresh or update the affected feed or post detail after creating a post, liking, or commenting.

## Day 15 acceptance criteria
- The first page loads.
- Scrolling to the bottom loads the next page.
- Posts are not skipped or repeated.
- Loading stops when there are no more pages.
- Loading, error, retry, and empty states work.
