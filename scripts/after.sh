cd /home/ubuntu/backtested

# download the env file
current_env=`cat /etc/backtested/env`
sudo -u ubuntu /usr/local/bin/aws s3 cp s3://ak-apps-configs/$current_env/$current_env.backtested.env .env

# link the shared node_modules
ln -s /home/ubuntu/shared/backtested/node_modules node_modules

# Run yarn commands as ubuntu user with full environment
sudo -u ubuntu -i bash << 'EOF'
cd /home/ubuntu/backtested
yarn
echo "Applying migrations"

yarn db:migrate:apply

checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

yarn db:generate
checker=$?
if [ "$checker" -ne "0" ]; then
    exit $checker
fi

yarn build
EOF
