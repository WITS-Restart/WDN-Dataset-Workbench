import wntr
import matplotlib.pyplot as plt
import os
import csv
import json

args_save_csv = True

# Define the mapping from EPANET node types to integers
epanet_node_type_mapping = {
    "junction": 0,
    "reservoir": 1,
    "tank": 2
}

# Define the mapping from EPANET link types to integers
epanet_link_type_mapping = {
    "pipe": 0,
    "pump": 1,
    "valve": 2
}


def print_simulation_details(wn):
    print("Simulation Details:")
    print(f"  Duration: {wn.options.time.duration / 86400} days")
    print(f"  Hydraulic Timestep: {wn.options.time.hydraulic_timestep} seconds")
    print(f"  Headloss Formula: {wn.options.hydraulic.headloss}")
    print(f"  Demand Model: {wn.options.hydraulic.demand_model}")
    print(f"  Minimum Pressure: {wn.options.hydraulic.minimum_pressure} meters")
    print(f"  Required Pressure: {wn.options.hydraulic.required_pressure} meters")


def execute_simulation_and_store_results(inp_path, inp_filename, save_path, save_csv_path, visualize=False, demand_pred=False):
    inp_file_path = inp_path + inp_filename + '.inp'

    print(f"Loading inp file: {inp_file_path}")
    wn = wntr.network.WaterNetworkModel(inp_file_path)
    wn.options.hydraulic.demand_model = 'PDD'

    sim = wntr.sim.WNTRSimulator(wn)
    print_simulation_details(wn)

    print(f"WNTR simulation started, can take a while...")
    results = sim.run_sim()
    print(f"WNTR simulation completed")

    nodes_results_to_dataset(wn, results, save_path, save_csv_path, inp_filename, demand_pred=demand_pred)

    return


def nodes_results_to_dataset(wn, results, save_path, save_csv_path, inp_filename, demand_pred=False):

    if args_save_csv:
        generate_csv_dataset(wn, results, save_csv_path)

    return


def nodes_to_csv(wn, results, save_csv_path, delimiter=','):
    print("Generating CSV nodes dataset...")

    nodes_name_list = wn.node_name_list

    timestamps = results.time

    node_csv_filepath = f'{save_csv_path}_nodes_dataset.csv'

    with open(node_csv_filepath, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=delimiter)

        columns = ['timestamp', 'node', 'demand', 'base_demand', 'head', 'pressure', 'elevation', 'x_coord', 'y_coord',
                   'leak_area', 'leak_demand', 'leak_discharge', 'leak_status', 'node_type']

        writer.writerow(columns)

        for timestamp in timestamps:

            for node in nodes_name_list:

                node_obj = wn.get_node(node)

                demand = results.node['demand'][node][timestamp]
                head = results.node['head'][node][timestamp]
                pressure = results.node['pressure'][node][timestamp]
                leak_area = node_obj.leak_area
                leak_demand = node_obj.leak_demand
                leak_discharge = node_obj.leak_discharge_coeff
                leak_status = node_obj.leak_status

                node_type = wn.get_node(node).node_type.lower()

                xy_pos = wn.get_node(node).coordinates

                x = xy_pos[0]
                y = xy_pos[1]

                if node_type == 'reservoir':
                    elevation = "n/a"
                    base_demand = "n/a"
                else:
                    elevation = wn.get_node(node).elevation
                    base_demand = node_obj.base_demand

                row = [timestamp, node, demand, base_demand, head, pressure, elevation, x, y, leak_area, leak_demand,
                       leak_discharge, leak_status, node_type]

                writer.writerow(row)

    print(f"CSV nodes dataset saved to: {node_csv_filepath}")


def links_to_csv(wn, results, save_csv_path, delimiter=','):
    print("Generating CSV links dataset...")

    timestamps = results.time

    link_name_list = wn.link_name_list

    link_csv_filepath = f'{save_csv_path}_links_dataset.csv'

    with open(link_csv_filepath, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=delimiter)

        columns = ['timestamp', 'link', 'flowrate', 'velocity', 'diameter', 'length', 'roughness', 'start_node',
                   'end_node', 'link_type']

        writer.writerow(columns)

        for timestamp in timestamps:

            for link_name in link_name_list:
                link = wn.get_link(link_name)

                flowrate = results.link['flowrate'][link_name][timestamp]
                velocity = results.link['velocity'][link_name][timestamp]

                diameter = link.diameter
                length = link.length
                roughness = link.roughness

                start_node = link.start_node_name
                end_node = link.end_node_name

                link_type = link.link_type.lower()

                row = [timestamp, link_name, flowrate, velocity, diameter, length, roughness, start_node, end_node,
                       link_type]

                writer.writerow(row)

    print(f"CSV links dataset saved to: {link_csv_filepath}")


def generate_csv_dataset(wn, results, save_csv_path, delimiter=','):
    nodes_to_csv(wn, results, save_csv_path, delimiter=delimiter)
    links_to_csv(wn, results, save_csv_path, delimiter=delimiter)
    # exit()

def main():
    root_path = '..'

    visualize = True
    inp_filename = "NET_3"


    inp_path = f'{root_path}/networks/dataset-network-epanet-src/NET_3/'
    save_path = f'{root_path}/networks/dataset-network-out/NET_3/test/'
    save_csv_path = f'{root_path}/networks/dataset-network-out/NET_3/test/'

    if not os.path.exists(save_csv_path):
        os.makedirs(save_csv_path)

    demand_pred = False
    if demand_pred:
        print("Demand Prediction")
    else:
        print("Pressure Prediction")

    execute_simulation_and_store_results(inp_path, inp_filename, save_path, save_csv_path, visualize=visualize, demand_pred=demand_pred)


if __name__ == '__main__':
    main()