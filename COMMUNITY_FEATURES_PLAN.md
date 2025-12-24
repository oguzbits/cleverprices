# Community Features - Future Implementation Plan

**Status:** Postponed  
**Created:** 2025-11-24  
**Priority:** Medium-High (after launch)

## Quick Summary

Transform realpricedata.com into a community-driven platform with:

- User accounts & profiles
- Voting system (upvote/downvote products)
- Favorites & bookmarks
- Comments & reviews
- "Community Picks" (daily/weekly/monthly)
- User dashboard & leaderboards

## Technology Stack

**Recommended: Supabase**

- PostgreSQL database
- Built-in authentication (email + OAuth)
- Real-time subscriptions
- GDPR-compliant (EU hosting)
- Free tier: 500MB DB, 50k monthly users
- Cost: Free to start, ~$25/month if you scale

**Alternative:** NextAuth.js + Vercel Postgres

## Key Features Breakdown

### Phase 1: Authentication & Profiles (Week 1)

- [ ] Set up Supabase project
- [ ] Configure authentication (email + optional OAuth)
- [ ] Create user profiles table
- [ ] Build sign-in/sign-up modal
- [ ] Add user menu to Navbar
- [ ] Create profile pages (`/profile/[username]`)
- [ ] Settings page (`/settings`)

### Phase 2: Product Interactions (Week 2)

- [ ] Upvote/downvote buttons on products
- [ ] Favorite/bookmark functionality
- [ ] User dashboard showing favorites
- [ ] Add vote count to product listings
- [ ] "Sort by community score" option

### Phase 3: Community Hub (Week 3)

- [ ] Comment system on products
- [ ] Community picks page (`/community/picks`)
- [ ] "Pick of the Day/Week/Month" widgets
- [ ] Top contributors leaderboard
- [ ] Recent activity feed

### Phase 4: Advanced (Optional)

- [ ] User achievements/badges
- [ ] Notifications system
- [ ] Follow other users
- [ ] User-generated content (submit products)
- [ ] Collections/lists

## Database Schema (Supabase)

```sql
-- User profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Favorites
create table public.favorites (
  id uuid primary key,
  user_id uuid references public.profiles,
  product_asin text not null,
  created_at timestamptz default now(),
  unique(user_id, product_asin)
);

-- Votes
create table public.votes (
  id uuid primary key,
  user_id uuid references public.profiles,
  product_asin text not null,
  vote_type text check (vote_type in ('up', 'down')),
  created_at timestamptz default now(),
  unique(user_id, product_asin)
);

-- Comments
create table public.comments (
  id uuid primary key,
  user_id uuid references public.profiles,
  product_asin text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Community picks (aggregated)
create table public.community_picks (
  id uuid primary key,
  product_asin text not null,
  period text not null, -- 'day', 'week', 'month'
  start_date date not null,
  vote_count int default 0,
  favorite_count int default 0
);
```

## Legal Requirements (IMPORTANT!)

### Must Update Before Launch:

1. **Datenschutzerklärung (Privacy Policy)**
   - Add section on user account data collection
   - Mention Supabase as data processor
   - Explain user activity tracking (votes, comments)
   - Data retention and deletion policy
   - User rights (export data, delete account)

2. **Create Terms of Service** (`/terms`)
   - Community guidelines
   - Content moderation policy
   - User-generated content rules
   - Account termination conditions

3. **GDPR Compliance Checklist**
   - [ ] Account deletion functionality
   - [ ] Data export functionality
   - [ ] Update cookie consent (session cookies)
   - [ ] Clear privacy notices on signup

## Questions to Answer (When Ready)

Before implementation, decide on:

1. **Username format**: Unique @username or just email login?
2. **Social login**: Enable Google/GitHub OAuth?
3. **Moderation**: Auto-approve comments or manual review?
4. **Profile visibility**: Public by default or private?
5. **Launch strategy**: All features at once or phased rollout?

## Estimated Timeline

- **Setup & Auth:** 1 week
- **Core features (vote/favorite):** 1 week
- **Community features:** 1 week
- **Testing & legal updates:** 1 week
- **Total:** ~4 weeks part-time

## Cost Estimate

- **Supabase Free Tier:** $0/month (up to 50k users)
- **Paid Tier (if needed):** ~$25/month
- **Legal review (optional):** €200-500 one-time

## Resources & References

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [GDPR Compliance for SaaS](https://gdpr.eu/checklist/)

## Next Steps (When Ready to Start)

1. Review and answer the 5 questions above
2. Create Supabase account and project
3. Update PROJECT_CONTEXT.md with community features info
4. Start with Phase 1 (Auth & Profiles)
5. Update legal pages BEFORE launch

---

**Note:** This is a significant feature addition. Consider launching the basic site first, gathering initial users, then adding community features based on feedback.
