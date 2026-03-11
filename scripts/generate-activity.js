#!/usr/bin/env node

/**
 * Generate a realistic, backdated git commit history for this repository.
 *
 * Date range: 2025-09-01 to 2025-12-17 (inclusive)
 *
 * Behavior:
 * - Most weekdays have commits, fewer on weekends.
 * - Varying day types:
 *   - light: 1–2 commits
 *   - normal: 3–5 commits
 *   - heavy: 7–10 commits, at most a couple of days per week
 * - Natural gaps: not every day is used.
 *
 * This script only touches `activity-log.md` in the repo root.
 */

import { execSync } from "child_process";
import { appendFileSync, existsSync } from "fs";
import { resolve } from "path";

// Directory one level above this script (the project root)
const REPO_ROOT = resolve(new URL("..", import.meta.url).pathname);
const ACTIVITY_LOG_PATH = resolve(REPO_ROOT, "activity-log.md");

/** Utility: run a command in the repo root and return trimmed stdout. */
function run(cmd) {
  return execSync(cmd, {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  }).trim();
}

/** Check that we are inside a git repo and the working tree is clean. */
function assertGitReady() {
  try {
    run("git rev-parse --is-inside-work-tree");
  } catch {
    console.error("This directory is not a git repository. Run `git init` first.");
    process.exit(1);
  }

  const status = run("git status --porcelain");
  if (status) {
    console.error(
      "Working tree is not clean. Commit or stash your changes before running this script."
    );
    process.exit(1);
  }
}

/** Parse CLI flags (currently only --dry-run). */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
  };
}

/** Return a Date for local time with given Y,M,D,h,m (M is 0-based). */
function makeDate(year, month, day, hour, minute) {
  return new Date(year, month, day, hour, minute, 0);
}

/** Get all dates between start and end (inclusive). */
function* iterateDates(start, end) {
  const cur = new Date(start.getTime());
  while (cur <= end) {
    yield new Date(cur.getTime());
    cur.setDate(cur.getDate() + 1);
  }
}

/** Random integer in [min, max]. */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random choice from array with weights (same length). */
function weightedChoice(options, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < options.length; i++) {
    acc += weights[i];
    if (r <= acc) return options[i];
  }
  return options[options.length - 1];
}

/** Format Date as ISO string suitable for GIT_AUTHOR_DATE. */
function formatGitDate(d) {
  // Force to local time with explicit offset
  const iso = d.toISOString();
  return iso;
}

/** Determine day type and commit count for a given date. */
function getCommitPlanForDate(date, weeklyHeavyState) {
  const dayOfWeek = date.getDay(); // 0=Sun..6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Natural chance to skip entire day
  const skipChance = isWeekend ? 0.7 : 0.15;
  if (Math.random() < skipChance) {
    return { type: "none", count: 0 };
  }

  if (isWeekend) {
    // Weekends: usually 0–2 commits
    const count = weightedChoice(
      [0, 1, 2],
      [5, 3, 2] // bias towards 0 or 1
    );
    return { type: count === 0 ? "none" : "light", count };
  }

  // Weekday
  // Track how many heavy days we've used this week
  if (!weeklyHeavyState.currentWeekStart) {
    weeklyHeavyState.currentWeekStart = new Date(date);
  }

  const weekStart = new Date(weeklyHeavyState.currentWeekStart);
  const diffDays = Math.floor(
    (date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0 || diffDays >= 7) {
    // New week window
    weeklyHeavyState.currentWeekStart = new Date(date);
    weeklyHeavyState.heavyUsed = 0;
  }

  const allowHeavy = weeklyHeavyState.heavyUsed < 2;

  const dayTypes = allowHeavy ? ["light", "normal", "heavy"] : ["light", "normal"];
  const weights = allowHeavy ? [3, 5, 1] : [4, 6]; // rare heavy days

  const dayType = weightedChoice(dayTypes, weights);

  let count;
  if (dayType === "light") {
    count = randInt(1, 2);
  } else if (dayType === "normal") {
    count = randInt(3, 5);
  } else {
    // heavy
    count = randInt(7, 10);
    weeklyHeavyState.heavyUsed += 1;
  }

  return { type: dayType, count };
}

/** Generate a random realistic time within the workday for a given date. */
function getCommitTimeForIndex(date, index, total) {
  // Workday window 9:00–19:00 (10 hours)
  const startHour = 9;
  const endHour = 19;
  const spanMinutes = (endHour - startHour) * 60;

  if (total <= 1) {
    const offset = randInt(0, spanMinutes);
    const minuteOfDay = startHour * 60 + offset;
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    return makeDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute
    );
  }

  // Evenly spread with some jitter
  const baseSlot = (index / (total - 1)) * spanMinutes;
  const jitter = randInt(-20, 20); // up to ~20 minutes of jitter
  let minuteOfDay = startHour * 60 + Math.round(baseSlot + jitter);
  if (minuteOfDay < startHour * 60) minuteOfDay = startHour * 60;
  if (minuteOfDay > endHour * 60 - 1) minuteOfDay = endHour * 60 - 1;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return makeDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute
  );
}

function main() {
  const { dryRun } = parseArgs();

  if (!existsSync(ACTIVITY_LOG_PATH)) {
    console.error("Expected `activity-log.md` in repo root but it was not found.");
    process.exit(1);
  }

  assertGitReady();

  const startDate = new Date("2025-09-01T00:00:00");
  const endDate = new Date("2025-12-17T23:59:59");

  const weeklyHeavyState = {
    heavyUsed: 0,
    currentWeekStart: null,
  };

  let totalCommits = 0;
  const perDaySummary = [];

  for (const date of iterateDates(startDate, endDate)) {
    const plan = getCommitPlanForDate(date, weeklyHeavyState);
    if (plan.count <= 0) {
      perDaySummary.push({
        date: date.toISOString().slice(0, 10),
        count: 0,
        type: "none",
      });
      continue;
    }

    const dayStr = date.toISOString().slice(0, 10);
    perDaySummary.push({
      date: dayStr,
      count: plan.count,
      type: plan.type,
    });

    for (let i = 0; i < plan.count; i++) {
      const commitTime = getCommitTimeForIndex(date, i, plan.count);
      const gitDate = formatGitDate(commitTime);

      const logLine = `[${gitDate}] ${plan.type} commit ${
        i + 1
      }/${plan.count} on ${dayStr}\n`;

      if (!dryRun) {
        appendFileSync(ACTIVITY_LOG_PATH, logLine, { encoding: "utf8" });
        // Stage and commit with backdated environment
        const env = {
          ...process.env,
          GIT_AUTHOR_DATE: gitDate,
          GIT_COMMITTER_DATE: gitDate,
        };

        // Stage and commit in two separate lightweight processes to reduce
        // pressure on the environment and avoid hitting OS spawn limits.
        execSync("git add activity-log.md", {
          cwd: REPO_ROOT,
          stdio: ["ignore", "ignore", "ignore"],
          env,
        });

        const messageVariants = [
          "chore: update activity log",
          "chore: record daily work notes",
          "docs: log progress update",
          "chore: tweak internal notes",
          "chore: append to activity log",
        ];
        const msg =
          messageVariants[randInt(0, messageVariants.length - 1)] +
          ` (${dayStr})`;

        execSync(`git commit -m "${msg}"`, {
          cwd: REPO_ROOT,
          stdio: ["ignore", "ignore", "ignore"],
          env,
        });
      }

      totalCommits += 1;
    }
  }

  // Summary output
  console.log("=== Activity Plan Summary ===");
  for (const d of perDaySummary) {
    if (d.count === 0) continue;
    console.log(`${d.date} - ${d.type} (${d.count} commits)`);
  }
  console.log("=============================");
  console.log(
    `Total commits ${dryRun ? "planned" : "created"}: ${totalCommits}`
  );
  console.log(
    "Run again with --dry-run to only print the plan without creating commits."
  );
}

main();


