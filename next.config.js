const nextConfig = {
    images:{
        remotePatterns: [
            {
                protocol: "https",
                hostname: "replicate.delivery",
            },
            {
                protocol:"https",
                hostname:"replicate.com",
            }
        ],

    },
   
};
module.exports = nextConfig;