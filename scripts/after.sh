cd /home/ubuntu/backtested

# download the env file
current_env=`cat /etc/backtested/env`
sudo -u ubuntu /usr/local/bin/aws s3 cp s3://ak-apps-configs/$current_env/$current_env.backtested.env .env


ln -s /home/ubuntu/shared/backtested/node_modules node_modules

# Set PATH to include NVM node/yarn location
YARN_PATH="/home/ubuntu/.nvm/versions/node/v22.18.0/bin"

# Run yarn commands as ubuntu user
sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn"
echo "Applying migrations"

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn db:migrate:apply"
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn db:generate"
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"$YARN_PATH:\$PATH\" && yarn build"
