import { useEffect, useState } from 'react';
import './App.css';
let ukey = import.meta.env.VITE_unsplashkey

export default function App() {
  const [favs, setfavs] = useState(JSON.parse(localStorage.getItem('areas')) || [])
  const [wdata, setwdata] = useState('');
  const [area, setarea] = useState('');
  const [bgdata, setbgdata] = useState('')
  const [units, setunits] = useState('metric')
  const [sidebar, setsidebar] = useState(false)
  const [err, seterr] = useState('')
  const [focus, setfocus] = useState('')

  useEffect(() => {
    function descriptionforfetch(oc) {
      let ans = ''
      if (oc === 0) { ans = 'clear sky' }
      if ([1, 2, 3].includes(oc)) { ans = 'partly cloudy' }
      if ([51, 53, 55, 56, 57].includes(oc)) { ans = 'drizzle' }
      if ([61, 63, 65, 80, 81, 82].includes(oc)) { ans = 'slight rain' }
      if ([66, 67, 95, 96, 99].includes(oc)) { ans = 'storm' }
      if ([71, 73, 75, 77, 85, 86].includes(oc)) { ans = 'snow' }
      if ([45, 48].includes(oc)) { ans = 'fog' }



      ans += ' ' + wdata.current.is_day ? ' day' : ' night'
      ans += ' ' + 'in' + ' ' + area
      console.log(ans)
      return ans

    }
    fetch(`https://api.unsplash.com/photos/random?client_id=${ukey}&orientation=landscape&query=${wdata ? descriptionforfetch(wdata.current.weather_code) : 'weather'}`)
      .then(resp => resp.json())
      .then(data => setbgdata(data.urls.regular))
  }, [wdata])


  async function getweather(warea) {
    try {
      setfocus(warea)
      seterr('')
      setwdata('')
      const geocodeurl = `https://geocoding-api.open-meteo.com/v1/search?name=${warea}&count=10&language=en&format=json`

      let resp = await fetch(geocodeurl)

      let data = await resp.json()
      if (!data.results) {
        throw new Error('some error')
      }



      const weatherurl = `https://api.open-meteo.com/v1/forecast?latitude=${data.results[0].latitude}&longitude=${data.results[0].longitude}&daily=weather_code,temperature_2m_max&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,precipitation,rain,weather_code&temperature_unit=${units === 'metric' ? 'celsius' : 'fahrenheit'}&windspeed_unit=${units === 'metric' ? 'ms' : 'mph'}`
      let resp2 = await fetch(weatherurl)

      let data2 = await resp2.json()
      setwdata(data2)
      setfocus(data.results[0].name)
    }
    catch (error) {
      seterr(error.message)
    }


  }

  function addtofavs() {
    if (!favs.includes(area)) {
      setfavs(prev => [...prev, area])
    }
  }

  function remfav(area) {
    setfavs(prev => prev.filter(each => each !== area))
  }

  useEffect(() => {
    localStorage.setItem('areas', JSON.stringify([...favs]))
  }, [favs])

  useEffect(() => {
    if (area) { getweather(area) }
  }, [units])


  function getimgcode(oc, isdaily) {
    let ans = ''
    if (oc === 0) { ans = '01' }
    if ([1, 2, 3].includes(oc)) { ans = '02' }
    if ([51, 53, 55, 56, 57].includes(oc)) { ans = '09' }
    if ([61, 63, 65, 80, 81, 82].includes(oc)) { ans = '10' }
    if ([66, 67, 95, 96, 99].includes(oc)) { ans = '11' }
    if ([71, 73, 75, 77, 85, 86].includes(oc)) { ans = '13' }
    if ([45, 48].includes(oc)) { ans = '50' }

    if (isdaily) { ans += wdata.current.is_day ? 'd' : 'n' }
    else { ans += 'd' }
    return ans
  }



  return (
    <div
      onClick={() => { setsidebar(false) }}
      className="main"
      style={{
        backgroundImage: `url(${bgdata})`,
      }}>

      <h1 className="title">Get Weather</h1>
      <br /><br />

      <form onSubmit={(e) => { e.preventDefault(); getweather(area) }}>
        <input
          type="text"
          placeholder='Enter any area'
          className="input-field"
          onChange={(e) => setarea(e.target.value)}
        />
      </form>
      <br /><br />

      {wdata && <>
        <div className="weather-info">
          <h1 className='areatitle'>{focus}:</h1>
          <div className='buttons'>
            <select className='units' onChange={(e) => { setunits(e.target.value) }}>
              <option disabled>select unit</option>
              <option value='metric'>metric</option>
              <option value='imperial'>imperial</option>
            </select>
            <button className='favorites' onClick={(e) => { e.stopPropagation(); setsidebar(prev => !prev) }}>favorites</button>
            <button onClick={(e) => { e.stopPropagation(); addtofavs() }}>add to favorites</button>
          </div>

          <div className="info-left-right">
            <div className="infoleft">
              <h2>{wdata.name}</h2>
              <img height={'100px'} width={'100px'} src={`https://openweathermap.org/img/wn/${getimgcode(wdata.current.weather_code, true)}@2x.png`} alt="" />
            </div>
            <div className="inforight">
              <p className='bold'>Temperature: <span >{wdata.current.temperature_2m} {wdata.current_units.temperature_2m}</span></p>
              <p className='bold'>Humidity: {wdata.current.relative_humidity_2m} {wdata.current_units.relative_humidity_2m}</p>
              <p className='bold'>feels like: {wdata.current.apparent_temperature} {wdata.current_units.apparent_temperature} </p>
              <p className='bold'>Wind Speed: {wdata.current.wind_speed_10m} {wdata.current_units.wind_speed_10m}</p>
            </div>
          </div>
        </div>


        <br /><br />
        <h2>forecasts:</h2>
        <br /><br />
        <div className="forecasts">
          {
            wdata.daily.time.slice(1).map((each, index) => {
              return <div className='fc'>
                <p className='bold'>{each}</p>
                <p className='bold'>{wdata.daily.temperature_2m_max[index]} {wdata.daily_units.temperature_2m_max}</p>
                <img src={`https://openweathermap.org/img/wn/${getimgcode(wdata.daily.weather_code[index], false)}@2x.png`} />
              </div>
            })
          }
        </div>
      </>
      }

      <div className={`sidebar ${sidebar && 'active'}`}>
        <p className='sidebarheading'>favorites</p>
        {
          favs.map(each => {
            return <div
              className='sidebaritem'
            >
              <h4 style={{ textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); getweather(each) }}>{each}</h4>
              <button onClick={(e) => { e.stopPropagation(); remfav(each) }}>x</button>
            </div>

          })
        }
      </div>


      {
        err && <h1>{err}</h1>
      }


    </div >
  )
}