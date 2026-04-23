
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkApplePay() {
  console.log("--- Stripe Apple Pay Diagnostic ---");
  
  try {
    // 1. Check Account Info
    const account = await stripe.accounts.retrieve();
    console.log(`Account ID: ${account.id}`);
    console.log(`Account Country: ${account.country}`);
    console.log(`Capabilities:`, account.capabilities);

    // 2. Check Apple Pay Domains
    console.log("\nChecking Registered Apple Pay Domains...");
    const domains = await stripe.applePayDomains.list();
    if (domains.data.length === 0) {
      console.log("❌ NO DOMAINS REGISTERED. Apple Pay will not work on your website.");
    } else {
      console.log("✅ Registered Domains:");
      domains.data.forEach(d => console.log(` - ${d.domain_name}`));
    }

    // 3. Check Payment Method Configurations
    console.log("\nChecking Payment Method Configurations...");
    // Check if apple_pay is enabled globally or for specific configs
    // Note: This often requires checking "Payment Method Configurations" API but we can check if it's available
    try {
        const configs = await stripe.paymentMethodConfigurations.list();
        configs.data.forEach(config => {
            console.log(`Config: ${config.name} (${config.id})`);
            console.log(` - Apple Pay Status: ${config.apple_pay?.display_preference?.value || 'unknown'}`);
        });
    } catch (e) {
        console.log("Payment Method Configurations API not accessible or empty.");
    }

    console.log("\n--- Recommendations ---");
    if (!domains.data.some(d => d.domain_name.includes("yawmy.app"))) {
      console.log("⚠️  'yawmy.app' is NOT in the domain list. You must register it.");
    }
    
  } catch (err) {
    console.error("Error during diagnostic:", err.message);
  }
}

checkApplePay();
