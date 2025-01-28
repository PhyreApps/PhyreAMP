<?php
phpinfo();

$checkFunctionsThatAreExist = [
    'phpinfo',
    'phpversion',
    'php_uname',
    'php_sapi_name',
    'php_ini_loaded_file',
    'mysql_connect',
    'mysqli_connect',
    'curl_init',
    'gd_info',
    'mysqli_fetch_all',
    'mysqli_connect'
];

foreach ($checkFunctionsThatAreExist as $function) {
    if (function_exists($function)) {
        echo '<span class="green">' . $function . ' exists' . "</span>" . "<br />";
    } else {
        echo '<span class="red">' . $function . ' does not exist' . "</span>" . "<br />";
    }
}

?>

<style>
    .red {
        color: red;
    }
    .green {
        color: green;
    }
</style>
