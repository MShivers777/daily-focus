-- Create user preferences table
create table public.user_preferences (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    marriage_priorities text[] not null default '{}',
    marriage_additional text[] not null default '{}',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(user_id)
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Create RLS policies
create policy "Users can view their own preferences"
    on public.user_preferences
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
    on public.user_preferences
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on public.user_preferences
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.user_preferences
    for each row
    execute procedure handle_updated_at();

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.user_preferences to anon, authenticated;
