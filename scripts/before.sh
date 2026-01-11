# check if collab folder exits
if [ ! -d /home/ubuntu/backtested ]; then
    mkdir -vp /home/ubuntu/backtested
fi

# cache the node_modules
if [ ! -d /home/ubuntu/shared/backtested ]; then
    mkdir -vp /home/ubuntu/shared/backtested/node_modules
fi