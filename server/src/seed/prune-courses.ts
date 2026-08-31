import { connectDb } from "../config/db.js";
import { keepNamedOrFirstCourses } from "../services/courseCleanup.service.js";

async function prune() {
  await connectDb();
  const result = await keepNamedOrFirstCourses(
    ["Biology Foundations", "Business Communications", "Marketing Strategy"],
    3
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

prune().catch((err) => {
  console.error(err);
  process.exit(1);
});
