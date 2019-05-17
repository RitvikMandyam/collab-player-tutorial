var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.set('views', 'public');
app.engine('handlebars', exphbs({
    defaultLayout: 'base',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('login');
});

app.listen(3000);
