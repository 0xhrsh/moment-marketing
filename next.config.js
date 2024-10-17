const nextConfig = {
    output:"standalone",
    reactStrictMode: true,
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