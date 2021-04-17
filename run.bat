cd Scriptable-OpenNetBattle-Server
git pull
cargo build --release
copy .\target\release\net_battle_server.exe ..\onb-server
cd ..\onb-server
net_battle_server.exe