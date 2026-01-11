cd /home/ubuntu/backtested

# download the env file
current_env=`cat /etc/backtested/env`
sudo -u ubuntu /usr/local/bin/aws s3 cp s3://ak-apps-configs/$current_env/$current_env.backtested.env .env


ln -s /home/ubuntu/shared/backtested/node_modules node_modules

# Set PATH to include common locations for node and yarn
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Run yarn commands as ubuntu user
sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"/usr/local/bin:/usr/bin:/bin:\$PATH\" && yarn"
echo "Applying migrations"

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"/usr/local/bin:/usr/bin:/bin:\$PATH\" && yarn db:migrate:apply"
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"/usr/local/bin:/usr/bin:/bin:\$PATH\" && yarn db:generate"
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

sudo -u ubuntu bash -c "cd /home/ubuntu/backtested && export PATH=\"/usr/local/bin:/usr/bin:/bin:\$PATH\" && yarn build"
