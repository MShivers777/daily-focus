create table public.body_metrics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    date date not null,
    weight numeric(5,2) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, date)
);

-- Add RLS policies
alter table public.body_metrics enable row level security;

create policy "Users can insert their own metrics"
    on body_metrics for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own metrics"
    on body_metrics for update
    using (auth.uid() = user_id);

create policy "Users can view their own metrics"
    on body_metrics for select
    using (auth.uid() = user_id);
