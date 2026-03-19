<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/src/assets/css/admin.css">
	<title>Список чатов</title>
</head>
<body>
	
	<div class = "admin-dialog opened">
		<p>
			<b>Открытые диалоги:</b>
		</p>
        <div class="phrases">
        </div>
	</div>

	<div class = "admin-dialog closed">
		<p>
			<b>Закрытые диалоги:</b>
		</p>
        <div class="phrases">

        </div>
	</div>

    <div id="app"></div>
    <script src = "js/admin/dialogs-tracker.js"></script>
</body>
</html>