-- Seed faction quest prompts (5 per faction, 11 factions = 55 prompts)
-- Tiers: 0 (+5), 200 (+10), 400 (+15), 600 (+20), 800 (+25)

-- ============================================================
-- Koa's Laboratory
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Field Sketch', 'Spend time in the wilds observing and sketching a wild monster''s daily routine — what it eats, where it rests, and how it behaves when undisturbed.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Reagent Run', 'Collect specific mineral or plant samples from a designated region that the Lab needs for ongoing experiments.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Behavioral Study', 'Observe and document how two different monster species interact when their territories overlap.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Research Notes","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Anomaly Assessment', 'Track down a monster exhibiting traits that don''t match its species record and compile a detailed assessment for the Lab.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Research Notes","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Annual Survey', 'Coordinate the Lab''s multi-island population census, managing field teams and compiling data across the archipelago.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Research Notes","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Rangers
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Trail Clearance', 'Clear fallen debris from a stretch of wilderness trail after recent weather damage to restore safe passage.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Night Patrol', 'Keep watch over a vulnerable area known for illegal monster trapping during the overnight hours.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Rescue Op', 'Locate and assist a monster that has become injured, trapped, or displaced far from its natural territory.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Habitat Restoration', 'Lead a team effort to restore a stretch of degraded land to support recovering monster populations.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Nesting Guard', 'Maintain a round-the-clock watch over a critical nesting ground through the entire duration of breeding season.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Digital Dawn
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Grid Patrol', 'Run diagnostic sweeps of Digital Dawn''s communication network and flag any irregularities before they become problems.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Data Retrieval', 'Recover corrupted data fragments from a malfunctioning field node before the information is permanently lost.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Infiltration Op', 'Embed yourself within a rival group under a false identity and return with actionable intelligence for the faction.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Digital Core","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Rift Dive', 'Enter an unstable digital rift with your monster and map its interior structure before it collapses.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Digital Core","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Convergence Crisis', 'Coordinate Digital Dawn''s full response to a large-scale digital-physical bleed event threatening to destabilize both worlds.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Digital Core","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Nyakuza
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Deck Duty', 'Help maintain a Nyakuza vessel before it sets sail — patching sails, coiling rigging, and hauling cargo into the hold.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Quiet Delivery', 'Transport an unmarked package across Pirate''s Bay through the Nyakuza''s discreet trade network without drawing attention.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Rival Recon', 'Pose as a neutral party at a rival crew''s gathering and return with something the Nyakuza can use.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Supply Raid', 'Board a rival vessel on the open water and make off with their cargo before backup can arrive.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Admiral''s Trial', 'Survive the Admiral''s high-seas command trial and prove you''re ready to lead your own Nyakuza crew.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Ranchers
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Morning Rounds', 'Work through the full morning chore rotation — feeding, watering, and checking on every monster in the paddock before the day''s real work begins.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Vet Day', 'Assist the ranch veterinarian with routine health checks, treatments, and vaccinations for the monster herd.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Wild Intake', 'Spend extended time working with a newly arrived wild monster, earning its trust until it''s ready to settle into ranch life.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Storm Response', 'Secure the ranch against incoming severe weather — getting every monster safely sheltered before the front hits.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Grand Rodeo', 'Compete in the annual Grand Rodeo — the most prestigious ranching event in the archipelago, drawing competitors from every island.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Project Obsidian
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Equipment Sterilization', 'Thoroughly clean and restock a research facility after the completion of a recent experiment cycle.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Observation Shift', 'Monitor and log an enhanced monster''s behavior, vitals, and responses over a full observation period.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Prototype Recovery', 'Retrieve a stolen Obsidian device from rival hands without triggering an incident that could expose the faction.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Controlled Trial', 'Participate in a supervised enhancement experiment, helping push the test monster beyond its natural limits.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Genesis Protocol', 'Take a leading role in the culmination of Obsidian''s most classified project — the creation of something that has never existed before.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Spirit Keepers
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Shrine Upkeep', 'Clean, re-offer, and restore a sacred shrine that has fallen into neglect, returning it to a state fit for spiritual use.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Spirit Mapping', 'Walk the land and document unusual monster and spirit activity to assess the region''s overall spiritual health.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Haunting Response', 'Investigate a haunting troubling a nearby settlement and perform the appropriate rites to resolve the disturbance.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Ward Renewal', 'Reinforce or fully replace the failing protective wards around a community at risk of spiritual incursion.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Elder''s Vigil', 'Keep watch through the night at the most sacred site in the archipelago, standing alongside the eldest Spirit Keeper.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Tribes
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Waterway Work', 'Clear debris from a sacred waterway that the Tribes have maintained for generations, working in silence alongside the community.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Elder''s Lesson', 'Sit with a Tribal elder and learn a piece of oral history, then find a way to preserve or share what you were told.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Bonding Rite', 'Take part in a traditional ceremony designed to deepen the bond between a trainer and their monster.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Border Defense', 'Stand with Tribal warriors to drive off outsiders encroaching on protected lands with the intention of exploiting them.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'The Great Migration', 'Help guide the Tribes safely through their seasonal migration across the archipelago''s most unforgiving terrain.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Twilight Order
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Component Gathering', 'Source and prepare the ritual materials needed for an upcoming Order ceremony under a senior member''s direction.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Rogue Suppression', 'Hunt down and contain a monster acting under malign spiritual influence before it causes lasting damage.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Restricted Study', 'Spend time deciphering a passage from a forbidden Order manuscript, working under close supervision.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Spirit Pact', 'Negotiate a formal binding agreement with a powerful spirit willing to align itself with the Order''s goals.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Eternal Eclipse', 'Lead the rare celestial ritual that stirs the Order''s oldest and most powerful spiritual ally from its long sleep.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- League
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'League'), 'Open Floor', 'Challenge a local gym or enter a beginner contest hall to get an honest read on where your skills currently stand.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'League'), 'Sanctioned Match', 'Take part in a formal League-registered battle or a contest appeal round judged by official League evaluators.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'League'), 'Coordinator Circuit', 'Work the regional contest circuit, building a record of appeal and battle performances toward Grand Festival qualification.', 15, 1, 400, '[{"type":"specific","items":[{"name":"League Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'League'), 'Elite Bout', 'Face a ranked League member in a high-stakes exhibition, or compete against top-tier coordinators in a Super Rank contest.', 20, 1, 600, '[{"type":"specific","items":[{"name":"League Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'League'), 'Grand Stage', 'Reach the final rounds of the Champion''s Trial or the Grand Festival and face the very best the League has to offer.', 25, 1, 800, '[{"type":"specific","items":[{"name":"League Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Tamers
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Sync Check', 'Run a full calibration on a fellow Tamer''s equipment to make sure it''s accurately reading digital fluctuations in the field.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Stray Recovery', 'Track a distressed digital monster that has slipped between dimensions and guide it safely back through the boundary.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Corruption Survey', 'Enter a newly corrupted digital zone and map its extent before it expands further into the physical world.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Viral Containment', 'Lead a coordinated response to isolate and neutralize a dangerous digital virus spreading across both worlds.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'The Accord', 'Broker a lasting peace between hostile factions within the digital world to secure long-term stability for all who live there.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Koa's Laboratory (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Supply Inventory', 'Audit the lab''s field supply stockroom and flag anything that needs restocking before the next expedition goes out.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Anatomical Sketches', 'Produce detailed anatomical illustrations of a specific monster species for the Lab''s permanent reference archive.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Migration Tracking', 'Follow and document a monster migration event — recording route, timing, herd composition, and any unusual behavior.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Research Notes","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'Field Experiment', 'Assist a senior researcher in running a non-invasive experiment on a monster in its natural environment.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Research Notes","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Koa''s Laboratory'), 'New Variant Discovery', 'Document and formally submit evidence of a previously unrecorded monster variant to the academic community on the Lab''s behalf.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Research Notes","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Rangers (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Water Quality Check', 'Test the water sources used by wild monsters across a region and log any signs of contamination or disruption.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Field Treatment', 'Set up a temporary station to treat and monitor a monster too injured to be safely moved to a proper facility.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Controlled Burn', 'Execute a planned controlled burn to clear dry undergrowth before wildfire season puts the wider ecosystem at risk.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Multi-Species Conflict', 'Mediate a volatile territorial conflict between multiple species before the instability collapses an entire local ecosystem.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Ranger Certification', 'Take a new Ranger recruit through a full field certification program and sign off on their readiness to operate solo.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Rangers — Hunters Subfaction
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Bounty Board', 'Pick up an entry-level contract from the Hunters'' board — a troublesome monster that needs to be driven off or put down.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Gear Crafting', 'Source raw materials and forge or commission your first set of Hunter''s weapons and armor in preparation for real hunts.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Assigned Hunt', 'Locate and neutralize a target monster that has been attacking travelers, raiding settlements, or destabilizing the local area.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Track and Trap', 'Study a dangerous monster''s movement patterns and deploy field traps to contain or cripple it before a direct confrontation.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Coordinated Ambush', 'Plan and execute a multi-person ambush on a monster too aggressive or armored to approach without careful preparation.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Trophy Harvest', 'Collect specific monster materials from a defeated target for use in crafting Hunter-grade equipment.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Apex Predator Hunt', 'Track and confront an apex predator that has begun destabilizing an entire region''s ecosystem — this one fights back hard.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Settlement Defense', 'Lead an armed Hunter patrol through monster-dense territory, intercepting and neutralizing threats before they reach civilian areas.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'Elder Class Response', 'Investigate a confirmed elder-class monster moving through the archipelago and coordinate the Hunter response before it causes catastrophic damage.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Rangers'), 'The Grand Hunt', 'Lead a full Hunter squad on a landmark operation against a monster so dangerous its defeat will be recorded in the Guild''s official history.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Ranger Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Digital Dawn (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Outpost Setup', 'Help establish a new Digital Dawn field outpost — running connections and syncing it to the main faction network.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Signal Analysis', 'Analyze an anomalous signal pattern flagged by the faction''s monitoring grid and write up a report on its likely source.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Asset Extraction', 'Retrieve a high-value digital asset from a compromised location before a rival faction can secure it first.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Digital Core","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'Node Hijacking', 'Commandeer a rival faction''s communication node and reroute its data stream back to Digital Dawn''s network.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Digital Core","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Digital Dawn'), 'The Override', 'Initiate a critical system override to seize permanent control of a key piece of digital infrastructure.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Digital Core","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Nyakuza (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Harbor Watch', 'Keep an eye on the docks for Ranger patrols and signal the fleet when the coast is clear to move goods.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Fence the Haul', 'Help offload and move a recent haul through the Nyakuza''s established network of black market contacts.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Decoy Run', 'Draw pursuit away from the main fleet by running a loud, visible route through patrolled waters to buy the crew time.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'Crew Rescue', 'Secure the release of a captured Nyakuza member through negotiation, misdirection, or a direct extraction.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Nyakuza'), 'The Legend Job', 'Pull off a heist so audacious and well-executed that it earns a permanent place in Nyakuza folklore.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Pirate Coin","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Ranchers (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Paddock Repair', 'Walk the full perimeter fixing broken fencing and reinforcing gate latches before any of the monsters figure out they can leave.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Forage Run', 'Head out into the surrounding wilderness to gather supplemental feed for monsters in the herd that need a more varied diet.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Breeding Program', 'Assist the lead rancher in carefully pairing compatible monsters to strengthen desirable traits across the next generation of the herd.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Stampede Control', 'Get in front of a spooked monster herd and redirect them before the stampede causes serious damage to the ranch or nearby land.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Ranchers'), 'Market Day', 'Transport and present the ranch''s monsters and goods at the archipelago''s largest seasonal trade market.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Fresh Milk","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Project Obsidian (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Security Patrol', 'Walk the perimeter of an Obsidian facility on the overnight shift and log anything that shouldn''t be there.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Dissection Assist', 'Assist a lead researcher with a post-experiment dissection, recording every measurement and observation to the decimal.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Defection Retrieval', 'Track down a former Obsidian asset who left the faction and bring them back — or ensure they can''t share what they know.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'Live Field Trial', 'Deploy an experimental enhancement on a monster in an uncontrolled field environment and document exactly what happens.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Project Obsidian'), 'The Apex Directive', 'Execute a top-level directive to field an enhanced asset capable of threatening any known monster — and verify the results.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Obsidian Shard","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Spirit Keepers (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Offering Preparation', 'Gather and arrange the traditional offerings required for an upcoming seasonal ceremony at a Spirit Keeper sanctuary.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Spiritual First Aid', 'Respond to a monster or person showing signs of spiritual corruption and provide the initial stabilization treatment.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Exorcism', 'Perform a full exorcism on a location or being that has become a vessel for a hostile spiritual entity.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'Ley Line Repair', 'Locate and restore a damaged ley line that has been disrupting spiritual energy flow across the island.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Spirit Keepers'), 'The Great Communion', 'Lead the seasonal ritual in which the Spirit Keepers commune directly with the island''s oldest and most powerful spiritual guardians.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Spirit Incense","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Tribes (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Tool Making', 'Work alongside Tribal craftspeople to produce traditional tools used in everyday Tribal life using only traditional methods.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Scout Ahead', 'Range ahead of the tribe to assess terrain, mark safe routes, and report back before the community moves.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Ritual Hunt', 'Take part in a ceremonial hunt conducted according to strict Tribal tradition, offered in thanks and respect to the land.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Ruins Documentation', 'Explore a recently uncovered ancient ruin and carefully document what you find without disturbing a single artifact.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tribes'), 'Council Recognition', 'Complete a legendary challenge set by the Tribal Council to be formally recognized as an honored ally of all the Tribes.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Tribal Totem","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Twilight Order (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Vigil Duty', 'Keep watch at a sacred Order site through the night, ensuring no outside force disrupts the ongoing ritual cycle.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Relic Recovery', 'Retrieve a spiritually charged relic from a dangerous location and return it safely to Order custody.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Initiation Rite', 'Oversee a new member''s initiation into the Twilight Order, guiding them through its trials and ensuring they emerge changed.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'Dark Energy Extraction', 'Locate and carefully extract a volatile concentration of dark spiritual energy from a site before it destabilizes and spreads.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Twilight Order'), 'The Ascension', 'Guide a chosen individual through the Order''s highest spiritual rite, overseeing their transformation from beginning to end.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Twilight Essence","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- League (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'League'), 'Practice Spar', 'Arrange and complete a casual but officially logged practice match against another trainer to sharpen your edge.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'League'), 'Away Contest', 'Enter a contest hall outside your home region, competing in unfamiliar territory for a new Ribbon and the experience that comes with it.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'League'), 'Referee Certification', 'Complete the League''s referee training program and preside over your first officially judged match.', 15, 1, 400, '[{"type":"specific","items":[{"name":"League Badge","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'League'), 'Tag Battle', 'Compete in a formal two-on-two tag battle alongside a partner against a ranked League pair.', 20, 1, 600, '[{"type":"specific","items":[{"name":"League Badge","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'League'), 'Hall of Champions', 'Secure a victory significant enough to earn your name a place in the League''s Hall of Champions.', 25, 1, 800, '[{"type":"specific","items":[{"name":"League Badge","quantity":3},{"name":"Rare Candy","quantity":1}]}]');

-- ============================================================
-- Tamers (set 2)
-- ============================================================
INSERT INTO faction_prompts (faction_id, name, description, modifier, is_active, standing_requirement, submission_gift_items)
VALUES
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Rookie Orientation', 'Walk a new Tamer through their first encounter with a digital anomaly, keeping them safe while they find their footing.', 5, 1, 0, NULL),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Gate Monitoring', 'Staff a digital gate monitoring station for a full shift, logging all anomalous readings and flagging anything critical.', 10, 1, 200, NULL),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Bio-Emergence Response', 'Respond to a bio-emergence event where a digital monster has crossed fully into the physical world and needs to be handled.', 15, 1, 400, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":1}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'Boundary Stabilization', 'Work with your monster to reinforce a fracture point where the boundary between the digital and physical worlds is thinning dangerously.', 20, 1, 600, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":2}]}]'),
  ((SELECT id FROM factions WHERE name = 'Tamers'), 'The Last Gate', 'Defend the final digital gate in your region from an overwhelming assault — if it falls, the connection is lost permanently.', 25, 1, 800, '[{"type":"specific","items":[{"name":"Digi-Core","quantity":3},{"name":"Rare Candy","quantity":1}]}]');
