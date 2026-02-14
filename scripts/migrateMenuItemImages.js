require("dotenv").config();
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");
const MenuItemImage = require("../models/MenuItemImage");

async function migrateMenuItemImages() {
  console.log("🚀 Starting menu item images migration...");

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB");

    // Get all menu items with existing image_url
    const menuItems = await MenuItem.find({
      image_url: { $exists: true, $ne: "", $ne: null },
    });

    console.log(
      `📊 Found ${menuItems.length} menu items with images to migrate`,
    );

    let migratedCount = 0;
    let errors = [];

    // process each menu item
    for (const item of menuItems) {
      try {
        // check if image already exists for this menu item to avoid duplicates
        const existingImage = await MenuItemImage.findOne({
          menuItemId: item._id,
        });
        if (existingImage) {
          console.log(
            `⚠️  MenuItem ${item._id} already has an image, skipping...`,
          );
          migratedCount++;
          continue;
        }

        // create new MenuItemImage document
        const menuItemImage = new MenuItemImage({
          menuItemId: item._id,
          url: item.image_url,
          isPrimary: true,
          order: 0,
        });

        await menuItemImage.save();

        migratedCount++;

        // Progress update every 10 items
        if (migratedCount % 10 === 0) {
          console.log(
            `📈 Progress: ${migratedCount}/${menuItems.length} migrated`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error migrating menu item ${menuItem._id}:`,
          error.message,
        );
        errors.push({
          menuItemId: menuItem._id.toString(),
          name: menuItem.name,
          error: error.message,
        });
      }
    }

    // Summary
    console.log("\n=== 📋 Migration Summary ===");
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`📊 Total processed: ${menuItems.length}`);

    // Verification
    console.log("\n=== 🔍 Verification ===");
    const totalImages = await MenuItemImage.countDocuments();
    console.log(`🖼️  Total MenuItemImages created: ${totalImages}`);

    const menuItemsWithImages = await MenuItemImage.distinct("menuItemId");
    console.log(
      `🍽️  Unique menu items with images: ${menuItemsWithImages.length}`,
    );

    // Save errors to file if any
    if (errors.length > 0) {
      const fs = require("fs");
      const errorFile = `migration-errors-${Date.now()}.json`;
      fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
      console.log(`📁 Errors saved to: ${errorFile}`);
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run with confirmation
if (require.main === module) {
  console.log(`
⚠️  ⚠️  ⚠️  PRODUCTION MIGRATION WARNING ⚠️  ⚠️  ⚠️

BEFORE PROCEEDING:
1. ✅ Ensure you have a recent database backup
2. ✅ Test this script on staging environment first
3. ✅ Run during low-traffic hours
4. ✅ Monitor the process

This script will:
• Create MenuItemImage documents from existing image_url
• Keep your original image_url data intact
• Mark the migrated images as primary (isPrimary: true)
`);

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('\nType "MIGRATE" to proceed: ', async (answer) => {
    if (answer === "MIGRATE") {
      console.log("\n⏳ Starting migration in 3 seconds...");
      setTimeout(async () => {
        await migrateMenuItemImages();
      }, 3000);
    } else {
      console.log("🛑 Migration cancelled.");
    }
    readline.close();
  });
}

module.exports = migrateMenuItemImages;
