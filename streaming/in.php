<?php
chdir('..');
include('inc.php');

$redis = new Redis();
$redis->pconnect('127.0.0.1', 6379);

if(array_key_exists('line', $_POST)) {
  refreshUsers();
  loadUsers();
  $redis->publish('indiewebcamp-irc', formatLine($_POST));
}

