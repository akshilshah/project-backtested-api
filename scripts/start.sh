cd /home/ubuntu/backtested

# Set PATH to include NVM node/yarn location
YARN_PATH="/home/ubuntu/.nvm/versions/node/v22.18.0/bin"

# Run yarn commands as ubuntu user
sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn stop"

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn start"