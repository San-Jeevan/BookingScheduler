import 'react-app-polyfill/ie11'; //Støtte for IE11
import 'react-app-polyfill/stable'; //Støtte for IE11
import React from 'react';
import ReactDOM from 'react-dom';
import Calendar from './Components/Calendar';

import {BrowserRouter as Router,Route} from "react-router-dom";


ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Route exact path="/" render={(props) => <Calendar  {...props} />} />
            <Route path="/uke/:weekNumber" render={(props) => <Calendar  {...props} />} />
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);

