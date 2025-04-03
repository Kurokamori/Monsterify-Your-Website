create table if not exists old_mons
(
    trainer_id          integer,
    player_user_id      bigint,
    name                text,
    level               integer,
    species1            text,
    species2            text,
    species3            text,
    type1               text,
    type2               text,
    type3               text,
    type4               text,
    type5               text,
    attribute           text,
    img_link            text,
    mon_index           integer,
    hp_total            integer,
    hp_ev               integer,
    hp_iv               integer,
    atk_total           integer,
    atk_ev              integer,
    atk_iv              integer,
    def_total           integer,
    def_ev              integer,
    def_iv              integer,
    spa_total           integer,
    spa_ev              integer,
    spa_iv              integer,
    spd_total           integer,
    spd_ev              integer,
    spd_iv              integer,
    spe_total           integer,
    spe_ev              integer,
    spe_iv              integer,
    acquired            text,
    poke_ball           text,
    talk                text,
    shiny               integer,
    alpha               integer,
    shadow              integer,
    paradox             integer,
    paradox_type        text,
    pokerus             integer,
    moveset             text,
    mega_stone          text,
    mega_image          text,
    mega_type1          text,
    mega_type2          text,
    mega_type3          text,
    mega_type4          text,
    mega_type5          text,
    mega_type6          text,
    mega_ability        text,
    mega_stat_bonus     text,
    friendship          integer,
    gender              text,
    pronouns            text,
    nature              text,
    characteristic      text,
    fav_berry           text,
    held_item           text,
    seal                text,
    mark                text,
    date_met            text,
    where_met           text,
    height              text,
    tldr                text,
    bio                 text,
    original_box        text,
    box_number          integer,
    mon_id              integer,
    trainer_index       integer,
    box_img_link        text,
    is_starter_template boolean,
    starter_set_number  integer,
    preevolution       text,
    evolution          text
);

alter table old_mons
    owner to u3f7f8n9i5oagn;

create table if not exists trainers
(
    id                     integer,
    player_user_id         text,
    name                   text,
    nickname               text,
    full_name              text,
    alter_human            integer,
    faction                text,
    title                  text,
    species1               text,
    species2               text,
    species3               text,
    type1                  text,
    type2                  text,
    type3                  text,
    type4                  text,
    type5                  text,
    type6                  text,
    ability                text,
    nature                 text,
    characteristic         text,
    fav_berry              text,
    fav_type1              text,
    fav_type2              text,
    fav_type3              text,
    fav_type4              text,
    fav_type5              text,
    fav_type6              text,
    gender                 text,
    pronouns               text,
    sexuality              text,
    age                    integer,
    birthday               text,
    height_ft              integer,
    height_in              integer,
    birthplace             text,
    residence              text,
    job                    text,
    googlesheet_link       text,
    main_ref               text,
    main_ref_artist        text,
    quote                  text,
    tldr                   text,
    long_bio               text,
    mega_evo               text,
    mega_main_reference    text,
    mega_artist            text,
    mega_type1             text,
    mega_type2             text,
    mega_type3             text,
    mega_type4             text,
    mega_type5             text,
    mega_type6             text,
    mega_ability           text,
    currency_amount        real,
    total_earned_currency  real,
    level                  integer,
    level_modifier         real,
    badges_earned          text,
    badge_amount           integer,
    frontier_badges_earned text,
    frontier_badges_amount integer,
    contest_ribbons_earned text,
    contest_ribbons_amount integer,
    mon_list               text,
    mon_amount             integer,
    mon_box_list           text,
    mon_battle_box         text,
    mon_referenced_list    text,
    mon_referenced_amount  integer,
    inv_items              text,
    inv_balls              text,
    inv_berries            text,
    inv_pastries           text,
    inv_evolution          text,
    inv_eggs               text,
    inv_antiques           text,
    inv_helditems          text,
    inv_seals              text,
    achievements           text,
    prompts                text,
    trainer_progression    text
);

alter table old_trainers
    owner to u3f7f8n9i5oagn;

create table if not exists mons
(
    mon_id              serial
        primary key,
    trainer_id          integer,
    player_user_id      bigint,
    name                text,
    level               integer   default 1,
    species1            text not null,
    species2            text,
    species3            text,
    type1               text not null,
    type2               text,
    type3               text,
    type4               text,
    type5               text,
    attribute           text,
    img_link            text,
    mon_index           integer,
    hp_total            integer,
    hp_ev               integer   default 0,
    hp_iv               integer,
    atk_total           integer,
    atk_ev              integer   default 0,
    atk_iv              integer,
    def_total           integer,
    def_ev              integer   default 0,
    def_iv              integer,
    spa_total           integer,
    spa_ev              integer   default 0,
    spa_iv              integer,
    spd_total           integer,
    spd_ev              integer   default 0,
    spd_iv              integer,
    spe_total           integer,
    spe_ev              integer   default 0,
    spe_iv              integer,
    acquired            text,
    poke_ball           text,
    talk                text,
    shiny               integer   default 0,
    alpha               integer   default 0,
    shadow              integer   default 0,
    paradox             integer   default 0,
    paradox_type        text,
    pokerus             integer   default 0,
    moveset             text,
    mega_stone          text,
    mega_image          text,
    mega_type1          text,
    mega_type2          text,
    mega_type3          text,
    mega_type4          text,
    mega_type5          text,
    mega_type6          text,
    mega_ability        text,
    mega_stat_bonus     text,
    friendship          integer   default 0,
    gender              text,
    pronouns            text,
    nature              text,
    characteristic      text,
    fav_berry           text,
    held_item           text,
    seal                text,
    mark                text,
    date_met            text,
    where_met           text,
    height              text,
    tldr                text,
    bio                 text,
    original_box        text,
    box_number          integer,
    trainer_index       integer,
    box_img_link        text,
    is_starter_template boolean   default false,
    starter_set_number  integer,
    created_at          timestamp default CURRENT_TIMESTAMP,
    updated_at          timestamp default CURRENT_TIMESTAMP
);

alter table mons
    owner to u3f7f8n9i5oagn;

create index if not exists idx_mons_trainer_id
    on mons (trainer_id);

create table if not exists trades
(
    trade_id        serial
        primary key,
    initiator_id    integer,
    recipient_id    integer,
    status          varchar(50) default 'pending'::character varying,
    offered_mons    integer[]   default '{}'::integer[],
    offered_items   jsonb       default '{}'::jsonb,
    requested_mons  integer[]   default '{}'::integer[],
    requested_items jsonb       default '{}'::jsonb,
    created_at      timestamp   default CURRENT_TIMESTAMP,
    updated_at      timestamp   default CURRENT_TIMESTAMP
);

alter table trades
    owner to u3f7f8n9i5oagn;

create index if not exists idx_trades_initiator
    on trades (initiator_id);

create index if not exists idx_trades_recipient
    on trades (recipient_id);

create table if not exists habits
(
    habit_id         serial
        primary key,
    trainer_id       integer,
    title            varchar(255) not null,
    description      text,
    difficulty       varchar(50) default 'medium'::character varying,
    frequency        varchar(50) default 'daily'::character varying,
    streak           integer     default 0,
    longest_streak   integer     default 0,
    last_completed   timestamp,
    level_reward     integer     default 1,
    coin_reward      integer     default 50,
    bound_to_mon_id  integer
                                  references mons
                                      on delete set null,
    bound_to_trainer boolean     default false,
    created_at       timestamp   default CURRENT_TIMESTAMP,
    updated_at       timestamp   default CURRENT_TIMESTAMP
);

alter table habits
    owner to u3f7f8n9i5oagn;

create index if not exists idx_habits_trainer_id
    on habits (trainer_id);

create index if not exists idx_habits_bound_to_mon
    on habits (bound_to_mon_id);

create table if not exists tasks
(
    task_id          serial
        primary key,
    trainer_id       integer,
    title            varchar(255) not null,
    description      text,
    difficulty       varchar(50) default 'medium'::character varying,
    due_date         timestamp,
    completed        boolean     default false,
    completed_at     timestamp,
    level_reward     integer     default 1,
    coin_reward      integer     default 100,
    bound_to_mon_id  integer
                                  references mons
                                      on delete set null,
    bound_to_trainer boolean     default false,
    reminder_enabled boolean     default false,
    reminder_time    timestamp,
    created_at       timestamp   default CURRENT_TIMESTAMP,
    updated_at       timestamp   default CURRENT_TIMESTAMP
);

alter table tasks
    owner to u3f7f8n9i5oagn;

create index if not exists idx_tasks_trainer_id
    on tasks (trainer_id);

create index if not exists idx_tasks_due_date
    on tasks (due_date);

create index if not exists idx_tasks_bound_to_mon
    on tasks (bound_to_mon_id);

create table if not exists reminders
(
    reminder_id    serial
        primary key,
    task_id        integer
        references tasks
            on delete cascade,
    trainer_id     integer,
    scheduled_time timestamp not null,
    sent           boolean   default false,
    response       varchar(50),
    created_at     timestamp default CURRENT_TIMESTAMP,
    updated_at     timestamp default CURRENT_TIMESTAMP
);

alter table reminders
    owner to u3f7f8n9i5oagn;

create index if not exists idx_reminders_scheduled_time
    on reminders (scheduled_time);

create index if not exists idx_reminders_task_id
    on reminders (task_id);

create table if not exists habit_completions
(
    completion_id         serial
        primary key,
    habit_id              integer
        references habits
            on delete cascade,
    completed_at          timestamp default CURRENT_TIMESTAMP,
    levels_gained         integer,
    coins_gained          integer,
    awarded_to_mon_id     integer
        references mons
            on delete set null,
    awarded_to_trainer_id integer
);

alter table habit_completions
    owner to u3f7f8n9i5oagn;

create index if not exists idx_habit_completions_habit_id
    on habit_completions (habit_id);

create table if not exists abilities
(
    "AbilityName"  text,
    "Effect"       text,
    "Generation"   text,
    "IsMainSeries" integer,
    "Pokemon"      text
);

alter table abilities
    owner to u3f7f8n9i5oagn;

create table if not exists digimon
(
    id                integer,
    name              text,
    "xAntibody"       text,
    "Stage"           text,
    types             text,
    attributes        text,
    fields            text,
    "priorEvolutions" text,
    "nextEvolutions"  text
);

alter table digimon
    owner to u3f7f8n9i5oagn;

create table if not exists items
(
    icon       text,
    name       text primary key,
    effect     text,
    rarity     text,
    category   text,
    base_price integer
);

alter table items
    owner to u3f7f8n9i5oagn;

create table if not exists moves
(
    "MoveName"     text,
    "Accuracy"     integer,
    "Power"        integer,
    "PP"           integer,
    "Priority"     integer,
    "EffectChance" integer,
    "Type"         text,
    "DamageClass"  text,
    "Effect"       text,
    "Generation"   text,
    "Target"       text,
    learnlevel     integer,
    attribute      text
);

alter table moves
    owner to u3f7f8n9i5oagn;

create table if not exists pokemon
(
    "SpeciesName"       text,
    "Stage"             text,
    "Type1"             text,
    "Type2"             text,
    region              text,
    pokedexnumber       integer,
    "Rarity"            text,
    is_starter          boolean,
    is_fossil           boolean,
    is_psuedolegendary  boolean,
    is_sublegendary     boolean,
    is_baby             boolean,
    "EvolvesFrom"       text,
    "EvolvesInto"       text,
    "BreedingResultsIn" text
);

alter table pokemon
    owner to u3f7f8n9i5oagn;

create table if not exists yokai
(
    id          text,
    "Name"      text,
    "Rank"      text,
    "Tribe"     text,
    "Attribute" text
);

alter table yokai
    owner to u3f7f8n9i5oagn;

create table if not exists trainers
(
    id                     serial
        primary key,
    player_user_id         varchar(255) not null,
    name                   text,
    nickname               text,
    full_name              text,
    alter_human            integer,
    faction                text,
    title                  text,
    species1               text,
    species2               text,
    species3               text,
    type1                  text,
    type2                  text,
    type3                  text,
    type4                  text,
    type5                  text,
    type6                  text,
    ability                text,
    nature                 text,
    characteristic         text,
    fav_berry              text,
    fav_type1              text,
    fav_type2              text,
    fav_type3              text,
    fav_type4              text,
    fav_type5              text,
    fav_type6              text,
    gender                 text,
    pronouns               text,
    sexuality              text,
    age                    integer,
    birthday               text,
    height_ft              integer,
    height_in              integer,
    birthplace             text,
    residence              text,
    job                    text,
    googlesheet_link       text,
    main_ref               text,
    main_ref_artist        text,
    quote                  text,
    tldr                   text,
    long_bio               text,
    mega_evo               text,
    mega_main_reference    text,
    mega_artist            text,
    mega_type1             text,
    mega_type2             text,
    mega_type3             text,
    mega_type4             text,
    mega_type5             text,
    mega_type6             text,
    mega_ability           text,
    currency_amount        real      default 0,
    total_earned_currency  real      default 0,
    level                  integer   default 1,
    level_modifier         real      default 1.0,
    badges_earned          text,
    badge_amount           integer   default 0,
    frontier_badges_earned text,
    frontier_badges_amount integer   default 0,
    contest_ribbons_earned text,
    contest_ribbons_amount integer   default 0,
    mon_list               text,
    mon_amount             integer   default 0,
    mon_box_list           text,
    mon_battle_box         text,
    mon_referenced_list    text,
    mon_referenced_amount  integer   default 0,
    inv_items              text      default '{}'::text,
    inv_balls              text      default '{}'::text,
    inv_berries            text      default '{}'::text,
    inv_pastries           text      default '{}'::text,
    inv_evolution          text      default '{}'::text,
    inv_eggs               text      default '{}'::text,
    inv_antiques           text      default '{}'::text,
    inv_helditems          text      default '{}'::text,
    inv_seals              text      default '{}'::text,
    achievements           text,
    prompts                text,
    trainer_progression    text,
    theme                  text,
    created_at             timestamp default CURRENT_TIMESTAMP,
    updated_at             timestamp default CURRENT_TIMESTAMP,
    player_display_name    varchar(255),
    additional_info        jsonb      default '{}'::jsonb
);

alter table trainers
    owner to u3f7f8n9i5oagn;

create index if not exists idx_trainer_player_id
    on trainers (player_user_id);

create table if not exists session
(
    sid    varchar      not null
        primary key,
    sess   json         not null,
    expire timestamp(6) not null
);

alter table session
    owner to u3f7f8n9i5oagn;

create index if not exists "IDX_session_expire"
    on session (expire);

create table if not exists users
(
    id           serial
        primary key,
    username     varchar(50)  not null
        unique,
    display_name varchar(100),
    discord_id   varchar(20)
        unique,
    password     varchar(100) not null,
    is_admin     boolean   default false,
    created_at   timestamp default CURRENT_TIMESTAMP
);

alter table users
    owner to u3f7f8n9i5oagn;

create table if not exists shop_config
(
    shop_id              varchar(50) primary key,
    name                 varchar(100) not null,
    description          text,
    image_url            text,
    category             varchar(50) not null,
    price_multiplier_min float default 1.0,
    price_multiplier_max float default 2.0,
    min_items            integer default 5,
    max_items            integer default 10,
    restock_hour         integer default 0,
    is_active            boolean default true,
    created_at           timestamp default CURRENT_TIMESTAMP,
    updated_at           timestamp default CURRENT_TIMESTAMP
);

alter table shop_config
    owner to u3f7f8n9i5oagn;

create table if not exists daily_shop_items
(
    id           serial primary key,
    shop_id      varchar(50) references shop_config (shop_id),
    item_id      varchar(100),
    price        integer not null,
    max_quantity integer default 1,
    date         date not null,
    created_at   timestamp default CURRENT_TIMESTAMP
);

alter table daily_shop_items
    owner to u3f7f8n9i5oagn;

create index if not exists idx_daily_shop_items_shop_date
    on daily_shop_items (shop_id, date);

create table if not exists player_shop_purchases
(
    id         serial primary key,
    player_id  varchar(50) not null,
    shop_id    varchar(50) not null,
    item_id    varchar(100) not null,
    quantity   integer not null,
    date       date not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default CURRENT_TIMESTAMP
);

alter table player_shop_purchases
    owner to u3f7f8n9i5oagn;

create index if not exists idx_player_shop_purchases_player
    on player_shop_purchases (player_id);

create index if not exists idx_player_shop_purchases_shop_date
    on player_shop_purchases (shop_id, date);

-- Boss tables
create table if not exists bosses
(
    boss_id              serial
        primary key,
    name                text not null,
    flavor_text         text,
    image_url           text,
    max_health          integer not null,
    current_health      integer not null,
    is_active           boolean default true,
    is_defeated         boolean default false,
    month               integer,
    year                integer,
    created_at          timestamp default CURRENT_TIMESTAMP,
    defeated_at         timestamp
);

alter table bosses
    owner to u3f7f8n9i5oagn;

create table if not exists boss_damage
(
    damage_id           serial
        primary key,
    boss_id             integer not null
        references bosses (boss_id) on delete cascade,
    trainer_id          integer not null
        references trainers (id) on delete cascade,
    damage_amount       integer not null,
    total_damage        integer not null,
    source              text,
    created_at          timestamp default CURRENT_TIMESTAMP
);

alter table boss_damage
    owner to u3f7f8n9i5oagn;

create index if not exists idx_boss_damage_boss_id
    on boss_damage (boss_id);

create index if not exists idx_boss_damage_trainer_id
    on boss_damage (trainer_id);

create table if not exists boss_rewards
(
    reward_id           serial
        primary key,
    boss_id             integer not null
        references bosses (boss_id) on delete cascade,
    trainer_id          integer not null
        references trainers (id) on delete cascade,
    coins               integer,
    items               jsonb,
    monsters            jsonb,
    is_claimed          boolean default false,
    created_at          timestamp default CURRENT_TIMESTAMP,
    claimed_at          timestamp
);

alter table boss_rewards
    owner to u3f7f8n9i5oagn;

create index if not exists idx_boss_rewards_boss_id
    on boss_rewards (boss_id);

create index if not exists idx_boss_rewards_trainer_id
    on boss_rewards (trainer_id);
