/*
    This example script performs a sequence of actions:

    1. Geocode an address to get latitude and longitude
    2. Login to Pokémon Trainer Club account
    3. Retrieve nearby map objects
    4. Retrieve detailed data for all gyms in the area
    5. Display information about each gym

    It shows how to use the pogobuf library to perform requests and work with the returend data.

    In addition to pogobuf, this example requires the npm packages s2geometry-node and node-geocoder.
*/

const pogobuf = require('pogobuf'),
    POGOProtos = require('node-pogo-protos'),
    s2 = require('s2geometry-node'),
    NodeGeocoder = require('node-geocoder');

var login = new pogobuf.PTCLogin(),
    client = new pogobuf.Client(),
    geocoder = NodeGeocoder(),
    lat,
    lng;

// Get latitude and longitude from geocoder
// Note: To avoid getting softbanned, change the address to one that is close to where you last used your account
geocoder.geocode('2 Bryant St, San Francisco')
    .then(location => {
        // if (!location.length) throw Error("No location found");
        // lat = location[0].latitude;
        // lng = location[0].longitude;
        lat = -7.754032;
        lng = 110.404819;

        // Login to PTC and get a login token
        return login.login('tamagodummy', 'semangat');
    })
    .then(token => {
        // Initialize the client
        client.setAuthInfo('ptc', token);
        client.setPosition(lat, lng);

        // Uncomment the following if you want to see every request/response on the console
        //client.setRequestCallback(console.dir);
        //client.setResponseCallback(console.dir);

        // Perform the initial request
        return client.init();
    })
    .then(() => {
        // Retrieve all map objects in the surrounding area
        var cellIDs = getCellIDs(1);
        return client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0));
    })
    .then(mapObjects => {
        // client.batchStart();

        // var pokestops = [];
        // mapObjects.map_cells.forEach(function (map) {
        //     map.forts.forEach(function (fort) {
        //         if(fort.type === 1) {
        //             // res = client.fortDetails('5ebf59f0121947efa40235187510f7d4.16', -7.754192, 110.403796);
        //             // pokestops.push(fort);
        //             client.fortDetails(fort.id, fort.latitude, fort.longitude)
        //         }
        //         // if(fort.lure_info != null) {
        //         //     res = client.fortDetails(fort.id, fort.latitude, fort.longitude);
        //         // }
        //     })
        // })

        return client.fortDetails('7f0732f95d1140f9a44de2503175f3c7.16', -7.754439, 110.405301);

        // Get all gyms from all returned map cells, then retrieve all of their details in one batch call
        // client.batchStart();
        // mapObjects.map_cells.map(cell => console.log(cell.forts));

        // mapObjects.map_cells.map(cell => cell.forts)
            // .reduce((a, b) => console.log(a));
            // .filter(fort => fort.type === 0)
            // .forEach(fort => client.getGymDetails(fort.id, fort.latitude, fort.longitude));

        // return client.batchCall();
    })
    .then(pokestop => {
        console.log(pokestop);

        client.batchStart();

        client.setPosition(-7.754445, 110.405134);

        client.fortSearch('7f0732f95d1140f9a44de2503175f3c7.16', -7.754439, 110.405301);

        return client.batchCall();
    })
    .then(pokestopResult => {
        console.log(pokestopResult);
    })
    // .then(gyms => {
    //     console.log(gyms);
        // gyms.forEach(gym => {
        //     console.log(gym);
        // })
    //     // Display gym information
    //     gyms.forEach(gym => {
    //         var fortData = gym.gym_state.fort_data,
    //             memberships = gym.gym_state.memberships;

    //         console.log(gym.name);
    //         console.log('-'.repeat(gym.name.length));

    //         var team = 'Owned by team: ' + getEnumKeyByValue(POGOProtos.Enums.TeamColor, fortData.owned_by_team);
    //         if (fortData.is_in_battle) team += ' [IN BATTLE]';
    //         console.log(team);

    //         console.log('Points: ' + fortData.gym_points);

    //         if (memberships && memberships.length) {
    //             var highest = memberships[memberships.length - 1];
    //             console.log('Highest Pokémon: ' + getEnumKeyByValue(POGOProtos.Enums.PokemonId, highest.pokemon_data.pokemon_id) + ', ' + highest.pokemon_data.cp + ' CP');
    //             console.log('Trainer: ' + highest.trainer_public_profile.name + ', level ' + highest.trainer_public_profile.level);
    //         }

    //         console.log();
    //     });
    // })
    .catch(console.error);

/**
 * Utility method to get all the S2 Cell IDs in a given radius.
 * Ported from https://github.com/tejado/pgoapi/blob/master/pokecli.py
 */
function getCellIDs(radius) {
    var cell = new s2.S2CellId(new s2.S2LatLng(lat, lng)),
        parentCell = cell.parent(15),
        prevCell = parentCell.prev(),
        nextCell = parentCell.next(),
        cellIDs = [parentCell.id()];

    for (var i = 0; i < radius; i++) {
        cellIDs.unshift(prevCell.id());
        cellIDs.push(nextCell.id());
        prevCell = prevCell.prev();
        nextCell = nextCell.next();
    }

    return cellIDs;
}

/**
 * Utility method that finds the name of the key for a given enum value and makes it
 * look a little nicer.
 */
function getEnumKeyByValue(enumObj, val) {
    for (var key of Object.keys(enumObj)) {
        if (enumObj[key] === val) return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    }
    return null;
}