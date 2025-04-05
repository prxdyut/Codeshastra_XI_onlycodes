export const CARDS = [
    {
        title: "Customizable Components",
        description:
            "Prebuilt components to handle essential functionality like user sign-in, sign-up, and account management.",
        href: "https://clerk.com/docs/components/overview?utm_source=vercel-template&utm_medium=partner&utm_term=component_reference",
        linkText: "Component Reference",
    },
    {
        title: "React Hooks",
        description: `Build custom functionality by accessing auth state, user and session data, and more with Clerk's React Hooks.`,
        href: "https://clerk.com/docs/references/react/use-user?utm_source=vercel-template&utm_medium=partner&utm_term=react_hooks",
        linkText: "React Hooks",
    },
    {
        title: "Organizations",
        description:
            "Built for B2B SaaS: create and switch between orgs, manage and invite members, and assign custom roles.",
        href: "https://clerk.com/docs/organizations/overview?utm_source=vercel-template&utm_medium=partner&utm_term=component_reference",
        linkText: "Organizations",
    },
];

export const DASHBOARD_CARDS = [
    {
        title: "Authenticate requests with JWT's",
        description:
            "Clerk empowers you to authenticate same and cross origin requests using a Clerk generated JWT",
        href: "https://clerk.com/docs/backend-requests/overview?utm_source=vercel-template&utm_medium=partner&utm_term=JWT",
        linkText: "Request authentication",
    },
    {
        title: "Build an onboarding flow",
        description: `Leverage customizable session tokens, public metadata, and Middleware to create a custom onboarding experience.`,
        href: "https://clerk.com/docs/guides/add-onboarding-flow?utm_source=vercel-template&utm_medium=partner&utm_term=onboarding",
        linkText: "Onboarding flow",
    },
    {
        title: "Deploy to Production",
        description:
            "Production instances are meant to support high volumes of traffic and by default, have a more strict security posture.",
        href: "https://clerk.com/docs/deployments/overview?utm_source=vercel-template&utm_medium=partner&utm_term=deploy-to-prod",
        linkText: "Production",
    },
];

export const TOOL_CATEGORIES = [
    {
        title: "Code Tools",
        tools: ["Code Formatter"],
        description: "Format and beautify your code",
        icon: "💻",
        route: "code-formatter"
    },
    {
        title: "Network Tools",
        tools: ["IP Lookup", "DNS Lookup", "Ping Test", "Traceroute"],
        description: "Network diagnostics and testing",
        icon: "🌐",
        routes: ["ip-lookup", "dns-lookup", "ping-test", "traceroute"]
    },
    {
        title: "Random Tools",
        tools: ["Random Number", "UUID Generator", "Dice Roll", "Coin Flip"],
        description: "Generate random values",
        icon: "🎲",
        routes: ["random-number", "uuid-generator", "dice-roll", "coin-flip"]
    },
    {
        title: "Conversion Tools",
        tools: ["CSV-Excel Editor", "Image Converter"],
        description: "Convert between formats",
        icon: "🔄",
        routes: ["csv-excel", "image-converter"]
    },
    {
        title: "Format Tools",
        tools: ["JSON Formatter", "Markdown Formatter", "YAML Formatter", "XML Formatter", "TOML Formatter"],
        description: "Format and validate data",
        icon: "📝",
        routes: ["json-formatter", "markdown-formatter", "yaml-formatter", "xml-formatter", "toml-formatter"]
    },
    {
        title: "Utility Tools",
        tools: ["QR Generator", "Password Generator", "URL Shortener", "API Tester"],
        description: "Helpful utilities",
        icon: "🔧",
        routes: ["qr-generator", "password-generator", "url-shortener", "api-tester"]
    }
];
