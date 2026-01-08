# check if collab folder exits
if [ ! -d /home/ubuntu/crypto ]; then
    mkdir -vp /home/ubuntu/crypto
fi

# cache the node_modules
if [ ! -d /home/ubuntu/shared/crypto ]; then
    mkdir -vp /home/ubuntu/shared/crypto/node_modules
fi