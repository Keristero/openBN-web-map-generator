cd Scriptable-OpenNetBattle-Server
#git pull
#cargo build --release
cp ./target/release/net_battle_server ../onb-server
cd ../onb-server
chmod +rwx ./net_battle_server
./net_battle_server