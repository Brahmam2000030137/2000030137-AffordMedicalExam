import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { withTranslation } from 'react-i18next';
import './App.css';
import Header from './components/Header/Header';
import SearchBar from './components/SearchBar/SearchBar';
import DataDisplay from './components/DataDisplay/DataDisplay';

const API = 'https://rata.digitraffic.fi/api/v1/';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      stations: [], 
      passengerStations: [], 
      todaysTrains: [],
      selectedStation: null,
      arrivalData: [],
      departureData: [],
      tabIndex: 0 
    };
  }

  componentDidMount() {
    this.fetchAll();
  }

  componentDidUpdate() {
    document.title = this.props.t('title'); 
  }

  handleInputChange = selectedStation => {
    this.setState({ selectedStation });
    this.filterData(selectedStation);
  };

  fetchAll() {
    const dateNow = new Date().toISOString().slice(0, 10); 
    Promise.all([
      fetch(`${API}metadata/stations`).then(response => response.json()),
      fetch(`${API}trains/${dateNow}`).then(response => response.json())
    ]).then(
      allResponses => {
        const stations = allResponses[0].map(station => ({
          value: station.stationShortCode,
          label: station.stationName.includes(' asema')
            ? station.stationName.slice(0, -6)
            : station.stationName
        }));
        const passengerStations = allResponses[0]
          .filter(station => station.passengerTraffic === true)
          .map(station => ({
            value: station.stationShortCode,
            label: station.stationName.includes(' asema')
              ? station.stationName.slice(0, -6)
              : station.stationName
          }));
        const todaysTrains = allResponses[1];
        this.setState({ stations, passengerStations, todaysTrains });
      },
      error => {
        this.setState({ error });
      }
    );
  }

  filterData(selectedStation) {
    const { todaysTrains, stations } = this.state;
    const dateTimeNow = new Date().toJSON();
    const filteredData = todaysTrains
      .map(train => {
        const trainNumber = train.commuterLineID
          ? `Commuter train ${train.commuterLineID}`
          : `${train.trainType} ${train.trainNumber}`; 
        const originShortCode = train.timeTableRows[0].stationShortCode; 
        const origin = stations.find(
          station => station.value === originShortCode
        ).label; 
        const destinationShortCode =
          train.timeTableRows[train.timeTableRows.length - 1][
            'stationShortCode'
          ];
        const destination = stations.find(
          station => station.value === destinationShortCode
        ).label;

        let scheduledArrivalTime; 
        let actualArrivalTime;
        const arrivalTimeTable = {
          ...train.timeTableRows.filter(
            element =>
              element.stationShortCode === selectedStation.value &&
              element.type === 'ARRIVAL'
          )[0]
        };
        if (arrivalTimeTable) {
          if (arrivalTimeTable.hasOwnProperty('scheduledTime')) {
            scheduledArrivalTime = arrivalTimeTable.scheduledTime;
          }
          if (arrivalTimeTable.hasOwnProperty('actualTime')) {
            actualArrivalTime = arrivalTimeTable.actualTime;
          } else if (arrivalTimeTable.hasOwnProperty('liveEstimateTime')) {
            actualArrivalTime = arrivalTimeTable.liveEstimateTime;
          } else {
            actualArrivalTime = false;
          }
        }
        let scheduledDepartureTime; 
        let actualDepartureTime;
        const departureTimeTable = {
          ...train.timeTableRows.filter(
            element =>
              element.stationShortCode === selectedStation.value &&
              element.type === 'DEPARTURE'
          )[0]
        };
        if (departureTimeTable) {
          if (departureTimeTable.hasOwnProperty('scheduledTime')) {
            scheduledDepartureTime = departureTimeTable.scheduledTime;
          }
          if (departureTimeTable.hasOwnProperty('actualTime')) {
            actualDepartureTime = departureTimeTable.actualTime;
          } else if (departureTimeTable.hasOwnProperty('liveEstimateTime')) {
            actualDepartureTime = departureTimeTable.liveEstimateTime;
          } else {
            actualDepartureTime = false;
          }
        }

        return {
          ...train,
          trainNumber,
          origin,
          destination,
          scheduledArrivalTime,
          actualArrivalTime,
          scheduledDepartureTime,
          actualDepartureTime
        };
      })
      .filter(train => train.trainCategory !== 'Cargo') 
      .filter(
        train =>
          train.actualArrivalTime > dateTimeNow ||
          train.scheduledArrivalTime > dateTimeNow ||
          train.actualDepartureTime > dateTimeNow ||
          train.scheduledDepartureTime > dateTimeNow
      ); 
    const arrivalData = filteredData
      .filter(entry => typeof entry.scheduledArrivalTime !== 'undefined')
      .map(entry => ({
        ...entry,
        actualTime: entry.actualArrivalTime,
        scheduledTime: entry.scheduledArrivalTime
      }));
    const departureData = filteredData
      .filter(entry => typeof entry.scheduledDepartureTime !== 'undefined')
      .map(entry => ({
        ...entry,
        actualTime: entry.actualDepartureTime,
        scheduledTime: entry.scheduledDepartureTime
      }));
    this.setState({ arrivalData, departureData });
  }

  render() {
    const {
      error,
      tabIndex,
      arrivalData,
      departureData,
      todaysTrains
    } = this.state;
    const { t } = this.props;
    const errorDisplay = (
      <div className="error">{error ? error.message : null}</div>
    );
    const content =
      todaysTrains.length === 0 ? (
        <p className="loading">{t('Loading')}...</p>
      ) : (
        <Tabs
          selectedIndex={tabIndex}
          onSelect={tabIndex => this.setState({ tabIndex })}
        >
          <TabList>
            <Tab>{t('Arrivals')}</Tab>
            <Tab>{t('Departures')}</Tab>
          </TabList>
          <TabPanel>
            <DataDisplay display="arrival" filteredData={arrivalData} />
            {errorDisplay}
          </TabPanel>
          <TabPanel>
            <DataDisplay display="departure" filteredData={departureData} />
            {errorDisplay}
          </TabPanel>
        </Tabs>
      );
    return (
      <div className="App">
        <Header />
        <SearchBar
          placeholder={t('Look for train station')}
          noOptionsMessage={inputValue => t('Not found')}
          options={this.state.passengerStations}
          onChange={this.handleInputChange}
        />
        {content}
      </div>
    );
  }
}

export default withTranslation()(App);
