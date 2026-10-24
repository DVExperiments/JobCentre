# The Job Centre

*Please take a ticket.* Pixel City's Job Centre: vacancies, the queue, employers and every pixel's working life. Published at `dvexperiments.github.io/JobCentre/`. Follows the [Pixel Universe Shared Conventions](../Pixel_Universe_Shared_Conventions.md).

The working records themselves live in City's `census.js` (see City's `LIFECYCLE.md`), because whether a household lights a new pixel depends on whether its adults have work. This site is the front desk: it reads `PixelUniverse.labour` and has no simulation of its own.

- **Records begin:** 00:00, 1 December 2026, city time.
- **Doors open:** 8:30am, Monday 7 December 2026. Open weekdays 8:30am to 5pm, city time.
- **On the map:** the Job Centre's building opens on its plot, and pixels looking for work queue outside it on weekday mornings.

## Pages

- `#/` today: the rate, the queue, "now serving", news, and districts and sectors.
- `#/vacancies`: employers who are hiring.
- `#/queue`: everyone looking for work, longest waiting first.
- `#/employers` and `#/employer/<id>`: the largest employers, and each one's staff.
- `#/worker/<id>`: a pixel's working life.
- `#/dreams`: pixels doing their dream job.

Add `?at=2026-12-09T10:00` (city time) to visit another moment.

Load after Weather, Senate, City's `universe.js` and `census.js`.
